package metlo

type NV struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type TraceUrl struct {
	Host       string `json:"host"`
	Path       string `json:"path"`
	Parameters []NV   `json:"parameters"`
}

type TraceReq struct {
	Url     TraceUrl `json:"url"`
	Headers []NV     `json:"headers"`
	Body    string   `json:"body"`
	Method  string   `json:"method"`
}

type TraceRes struct {
	Status  int    `json:"status"`
	Headers []NV   `json:"headers"`
	Body    string `json:"body"`
}

type TraceMeta struct {
	Environment     string `json:"environment"`
	Incoming        bool   `json:"incoming"`
	Source          string `json:"source"`
	SourcePort      int    `json:"sourcePort"`
	Destination     string `json:"destination"`
	DestinationPort int    `json:"destinationPort"`
	MetloSource     string `json:"metloSource"`
}

type MetloTrace struct {
	Request  TraceReq  `json:"request"`
	Response TraceRes  `json:"response"`
	Meta     TraceMeta `json:"meta"`
}
