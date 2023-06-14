package metlo

import (
	"log"
	"os"
)

type LogLevel int

const (
	Trace LogLevel = iota
	Debug
	Info
	Warn
	Error
)

func MapLogLevelToString(lvl LogLevel) string {
	switch lvl {
	case Trace:
		return "trace"
	case Debug:
		return "debug"
	case Info:
		return "info"
	case Warn:
		return "warn"
	case Error:
		return "error"
	default:
		return "info"
	}
}

var logger *log.Logger

func init() {
	logger = log.New(os.Stderr, "Metlo: ", log.Ldate|log.Ltime|log.Lshortfile)
}
