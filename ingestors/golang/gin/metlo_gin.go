package metloGin

import (
	"bytes"
	"io/ioutil"
	"log"
	"net"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	metlo "github.com/metlo-labs/metlo/ingestors/golang/metlo"
)

const MAX_BODY int = 10 * 1024

type metloApp interface {
	Send(data metlo.MetloTrace)
	Block(req metlo.TraceReq, meta metlo.TraceMeta) bool
	Allow() bool
}

type bodyLogWriter struct {
	gin.ResponseWriter
	body         *bytes.Buffer
	bytesWritten *int
}

type metloInstrumentation struct {
	app        metloApp
	serverHost string
	serverPort int
	rejectFn   func(*gin.Context)
}

type CustomInitParams struct {
	app        metloApp
	serverHost string
	serverPort int
	rejectFn   func(*gin.Context)
}

func Init(app metloApp) metloInstrumentation {
	return CustomInit(app, "localhost", 0)
}

func CustomInit(app metloApp, serverHost string, serverPort int) metloInstrumentation {
	return metloInstrumentation{
		app:        app,
		serverHost: serverHost,
		serverPort: serverPort,
		rejectFn:   nil,
	}
}

func min(a int, b int) int {
	if a < b {
		return a
	}
	return b
}

func (w bodyLogWriter) Write(b []byte) (int, error) {
	var byte_length = len(b)
	var bytes_to_write int = min(min(MAX_BODY, byte_length), MAX_BODY-*w.bytesWritten)
	*w.bytesWritten = *w.bytesWritten + bytes_to_write
	var sub_buffer []byte = b[0:bytes_to_write]
	w.body.Write(sub_buffer)
	return w.ResponseWriter.Write(b)
}

func (m *metloInstrumentation) SetRejectFn(rejectFn func(*gin.Context)) {
	m.rejectFn = rejectFn
}

func (m *metloInstrumentation) Middleware(c *gin.Context) {
	var bytesWritten *int = new(int)
	*bytesWritten = 0
	blw := &bodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer, bytesWritten: bytesWritten}
	c.Writer = blw
	body, _ := ioutil.ReadAll(c.Request.Body)
	c.Request.Body.Close()
	c.Request.Body = ioutil.NopCloser(bytes.NewReader(body))

	if m.app.Allow() {
		reqHeaders := make([]metlo.NV, 0)
		for k := range c.Request.Header {
			reqHeaders = append(reqHeaders, metlo.NV{Name: k, Value: strings.Join(c.Request.Header[k], ",")})
		}
		queryMap := c.Request.URL.Query()
		queryParams := make([]metlo.NV, 0)
		for k := range queryMap {
			queryParams = append(queryParams, metlo.NV{Name: k, Value: strings.Join(queryMap[k], ",")})
		}
		_, sourcePortRaw, err := net.SplitHostPort(c.Request.RemoteAddr)
		if err != nil {
			log.Println("Metlo couldn't find source port for incoming request")
		}

		sourcePort, err := strconv.Atoi(sourcePortRaw)
		if err != nil {
			log.Println("Metlo couldn't find source port for incoming request")
		}

		req := metlo.TraceReq{
			Url: metlo.TraceUrl{
				Host:       c.Request.Host,
				Path:       c.Request.URL.Path,
				Parameters: queryParams,
			},
			Headers: reqHeaders,
			Body:    string(body),
			Method:  c.Request.Method,
		}

		meta := metlo.TraceMeta{
			Environment:     "production",
			Incoming:        true,
			Source:          c.ClientIP(),
			SourcePort:      sourcePort,
			Destination:     m.serverHost,
			DestinationPort: m.serverPort,
			MetloSource:     "go/gin",
		}

		if m.app.Block(req, meta) {
			if m.rejectFn != nil {
				m.rejectFn(c)
			} else {
				c.String(403, "Forbidden")
			}
			c.Abort()
		} else {
			c.Next()
		}
		resHeaderMap := c.Writer.Header()
		resHeaders := make([]metlo.NV, 0)
		for k := range resHeaderMap {
			resHeaders = append(resHeaders, metlo.NV{Name: k, Value: strings.Join(resHeaderMap[k], ",")})
		}

		tr := metlo.MetloTrace{
			Request: req,
			Response: metlo.TraceRes{
				Status:  blw.Status(),
				Body:    blw.body.String(),
				Headers: resHeaders,
			},
			Meta: meta,
		}

		go m.app.Send(tr)
	} else {
		c.Next()
	}
}
