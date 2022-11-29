package metloGorilla

import (
	"bytes"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
)

type metloApp interface {
	Send(data any)
	Allow() bool
}

type nv struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type url struct {
	Host       string `json:"host"`
	Path       string `json:"path"`
	Parameters []nv   `json:"parameters"`
}

type req struct {
	Url     url    `json:"url"`
	Headers []nv   `json:"headers"`
	Body    string `json:"body"`
	Method  string `json:"method"`
}

type res struct {
	Url     string `json:"url"`
	Status  int    `json:"status"`
	Headers []nv   `json:"headers"`
	Body    string `json:"body"`
}

type meta struct {
	Environment     string `json:"environment"`
	Incoming        bool   `json:"incoming"`
	Source          string `json:"source"`
	SourcePort      int    `json:"sourcePort"`
	Destination     string `json:"destination"`
	DestinationPort int    `json:"destinationPort"`
	MetloSource     string `json:"metloSource"`
}

type trace struct {
	Request  req  `json:"request"`
	Response res  `json:"response"`
	Meta     meta `json:"meta"`
}

type logResponseWriter struct {
	http.ResponseWriter
	statusCode int
	buf        bytes.Buffer
}

type metloInstrumentation struct {
	app        metloApp
	serverHost string
	serverPort int
}

func Init(app metloApp) metloInstrumentation {
	return CustomInit(app, "localhost", 0)
}

func CustomInit(app metloApp, serverHost string, serverPort int) metloInstrumentation {
	return metloInstrumentation{
		app:        app,
		serverHost: serverHost,
		serverPort: serverPort,
	}
}

func newLogResponseWriter(w http.ResponseWriter) *logResponseWriter {
	return &logResponseWriter{ResponseWriter: w}
}

func (w *logResponseWriter) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *logResponseWriter) Write(body []byte) (int, error) {
	w.buf.Write(body)
	return w.ResponseWriter.Write(body)
}

func (m *metloInstrumentation) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		logRespWriter := newLogResponseWriter(w)
		body, _ := ioutil.ReadAll(r.Body)
		r.Body.Close()
		r.Body = ioutil.NopCloser(bytes.NewReader(body))
		next.ServeHTTP(logRespWriter, r)

		if m.app.Allow() {
			reqHeaders := make([]nv, 0)
			for k := range r.Header {
				reqHeaders = append(reqHeaders, nv{Name: k, Value: strings.Join(r.Header[k], ",")})
			}
			resHeaderMap := logRespWriter.Header()
			resHeaders := make([]nv, 0)
			for k := range resHeaderMap {
				resHeaders = append(resHeaders, nv{Name: k, Value: strings.Join(resHeaderMap[k], ",")})
			}
			queryMap := r.URL.Query()
			queryParams := make([]nv, 0)
			for k := range queryMap {
				queryParams = append(queryParams, nv{Name: k, Value: strings.Join(queryMap[k], ",")})
			}

			sourceIp, sourcePortRaw, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				log.Println("Metlo couldn't find source port for incoming request")
			}

			sourcePort, err := strconv.Atoi(sourcePortRaw)
			if err != nil {
				log.Println("Metlo couldn't find source port for incoming request")
			}

			statusCode := logRespWriter.statusCode
			if statusCode == 0 {
				statusCode = 200
			}

			tr := &trace{
				Request: req{
					Url: url{
						Host:       r.Host,
						Path:       r.URL.Path,
						Parameters: queryParams,
					},
					Headers: reqHeaders,
					Body:    string(body),
					Method:  r.Method,
				},
				Response: res{
					Url:     "",
					Status:  statusCode,
					Body:    logRespWriter.buf.String(),
					Headers: resHeaders,
				},
				Meta: meta{
					Environment:     "production",
					Incoming:        true,
					Source:          sourceIp,
					SourcePort:      sourcePort,
					Destination:     m.serverHost,
					DestinationPort: m.serverPort,
					MetloSource:     "go/gorilla",
				},
			}

			go m.app.Send(tr)
		}
	})
}
