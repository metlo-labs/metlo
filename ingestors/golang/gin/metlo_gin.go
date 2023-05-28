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

type metloApp interface {
	Send(data metlo.MetloTrace)
	Allow() bool
}

type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
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

func (w bodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func (m *metloInstrumentation) Middleware(c *gin.Context) {
	blw := &bodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
	c.Writer = blw
	body, _ := ioutil.ReadAll(c.Request.Body)
	c.Request.Body.Close()
	c.Request.Body = ioutil.NopCloser(bytes.NewReader(body))
	c.Next()
	if m.app.Allow() {
		reqHeaders := make([]metlo.NV, 0)
		for k := range c.Request.Header {
			reqHeaders = append(reqHeaders, metlo.NV{Name: k, Value: strings.Join(c.Request.Header[k], ",")})
		}
		resHeaderMap := c.Writer.Header()
		resHeaders := make([]metlo.NV, 0)
		for k := range resHeaderMap {
			resHeaders = append(resHeaders, metlo.NV{Name: k, Value: strings.Join(resHeaderMap[k], ",")})
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

		tr := metlo.MetloTrace{
			Request: metlo.TraceReq{
				Url: metlo.TraceUrl{
					Host:       c.Request.Host,
					Path:       c.Request.URL.Path,
					Parameters: queryParams,
				},
				Headers: reqHeaders,
				Body:    string(body),
				Method:  c.Request.Method,
			},
			Response: metlo.TraceRes{
				Status:  blw.Status(),
				Body:    blw.body.String(),
				Headers: resHeaders,
			},
			Meta: metlo.TraceMeta{
				Environment:     "production",
				Incoming:        true,
				Source:          c.ClientIP(),
				SourcePort:      sourcePort,
				Destination:     m.serverHost,
				DestinationPort: m.serverPort,
				MetloSource:     "go/gin",
			},
		}

		go m.app.Send(tr)

	}
}
