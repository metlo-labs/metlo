package metloGorilla

import (
	"bytes"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"

	metlo "github.com/metlo-labs/metlo/ingestors/golang/metlo"
)

const MAX_BODY int = 10 * 1024

type metloApp interface {
	Send(data metlo.MetloTrace)
	ShouldBlock(request metlo.TraceReq, meta metlo.TraceMeta) bool
	UpdateRateLimit(data metlo.MetloTrace)
	Allow() bool
}

type logResponseWriter struct {
	http.ResponseWriter
	statusCode   int
	buf          bytes.Buffer
	bytesWritten *int
}

type metloInstrumentation struct {
	app        metloApp
	serverHost string
	serverPort int
	getUser    func(r *http.Request) *string
}

func Init(app metloApp) metloInstrumentation {
	return CustomInit(app, "localhost", 0, nil)
}

func CustomInit(app metloApp, serverHost string, serverPort int, getUser func(r *http.Request) *string) metloInstrumentation {
	return metloInstrumentation{
		app:        app,
		serverHost: serverHost,
		serverPort: serverPort,
		getUser:    getUser,
	}
}

func newLogResponseWriter(w http.ResponseWriter) *logResponseWriter {
	var bytesWritten *int = new(int)
	*bytesWritten = 0
	return &logResponseWriter{ResponseWriter: w, bytesWritten: bytesWritten}
}

func min(a int, b int) int {
	if a < b {
		return a
	}
	return b
}

func (w *logResponseWriter) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *logResponseWriter) Write(body []byte) (int, error) {
	var byte_length = len(body)
	var bytes_to_write int = min(min(MAX_BODY, byte_length), MAX_BODY-*w.bytesWritten)
	*w.bytesWritten = *w.bytesWritten + bytes_to_write
	var sub_buffer []byte = body[0:bytes_to_write]
	w.buf.Write(sub_buffer)
	return w.ResponseWriter.Write(body)
}

func (m *metloInstrumentation) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		logRespWriter := newLogResponseWriter(w)
		body, _ := ioutil.ReadAll(r.Body)
		r.Body.Close()
		r.Body = ioutil.NopCloser(bytes.NewReader(body))

		if m.app.Allow() {
			reqHeaders := make([]metlo.NV, 0)
			for k := range r.Header {
				reqHeaders = append(reqHeaders, metlo.NV{Name: k, Value: strings.Join(r.Header[k], ",")})
			}
			queryMap := r.URL.Query()
			queryParams := make([]metlo.NV, 0)
			for k := range queryMap {
				queryParams = append(queryParams, metlo.NV{Name: k, Value: strings.Join(queryMap[k], ",")})
			}

			sourceIp, sourcePortRaw, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				log.Println("Metlo couldn't find source port for incoming request")
			}

			sourcePort, err := strconv.Atoi(sourcePortRaw)
			if err != nil {
				log.Println("Metlo couldn't find source port for incoming request")
			}

			var user *string
			if m.getUser != nil {
				user = m.getUser(r)
			} else {
				user = nil
			}

			request := metlo.TraceReq{
				Url: metlo.TraceUrl{
					Host:       r.Host,
					Path:       r.URL.Path,
					Parameters: queryParams,
				},
				Headers: reqHeaders,
				Body:    string(body),
				Method:  r.Method,
				User:    user,
			}
			meta := metlo.TraceMeta{
				Environment:     "production",
				Incoming:        true,
				Source:          sourceIp,
				SourcePort:      sourcePort,
				Destination:     m.serverHost,
				DestinationPort: m.serverPort,
				MetloSource:     "go/gorilla",
			}

			if m.app.ShouldBlock(request, meta) {
				logRespWriter.Write([]byte("Forbidden"))
				logRespWriter.statusCode = 403
			} else {
				next.ServeHTTP(logRespWriter, r)
			}

			statusCode := logRespWriter.statusCode
			if statusCode == 0 {
				statusCode = 200
			}

			resHeaderMap := logRespWriter.Header()
			resHeaders := make([]metlo.NV, 0)
			for k := range resHeaderMap {
				resHeaders = append(resHeaders, metlo.NV{Name: k, Value: strings.Join(resHeaderMap[k], ",")})
			}
			tr := metlo.MetloTrace{
				Request: request,
				Response: metlo.TraceRes{
					Status:  statusCode,
					Body:    logRespWriter.buf.String(),
					Headers: resHeaders,
				},
				Meta: meta,
			}

			m.app.UpdateRateLimit(tr)

			go m.app.Send(tr)
		} else {
			next.ServeHTTP(logRespWriter, r)
		}
	})
}
