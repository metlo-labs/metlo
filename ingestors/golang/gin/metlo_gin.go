package metloGin

import (
	"bytes"
	"io/ioutil"
	"log"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
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
	c.Request.Body = ioutil.NopCloser(bytes.NewReader(body))
	c.Next()
	if m.app.Allow() {
		reqHeaders := make([]nv, 0)
		for k := range c.Request.Header {
			reqHeaders = append(reqHeaders, nv{Name: k, Value: strings.Join(c.Request.Header[k], ",")})
		}
		resHeaderMap := c.Writer.Header()
		resHeaders := make([]nv, 0)
		for k := range resHeaderMap {
			resHeaders = append(resHeaders, nv{Name: k, Value: strings.Join(resHeaderMap[k], ",")})
		}
		queryMap := c.Request.URL.Query()
		queryParams := make([]nv, 0)
		for k := range queryMap {
			queryParams = append(queryParams, nv{Name: k, Value: strings.Join(queryMap[k], ",")})
		}
		splitAddr := strings.Split(c.Request.RemoteAddr, ":")
		remAddr := splitAddr[len(splitAddr)-1]
		sourcePort, err := strconv.Atoi(remAddr)
		if err != nil {
			log.Println("Metlo couldn't find source port for incoming request")
		}

		tr := &trace{
			Request: req{
				Url: url{
					Host:       c.Request.Host,
					Path:       c.Request.URL.Path,
					Parameters: queryParams,
				},
				Headers: reqHeaders,
				Body:    string(body),
				Method:  c.Request.Method,
			},
			Response: res{
				Url:     "",
				Status:  blw.Status(),
				Body:    blw.body.String(),
				Headers: resHeaders,
			},
			Meta: meta{
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
