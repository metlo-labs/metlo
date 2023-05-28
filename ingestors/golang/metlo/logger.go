package metlo

import (
	"log"
	"os"
)

var logger *log.Logger

func init() {
	logger = log.New(os.Stderr, "Metlo: ", log.Ldate|log.Ltime|log.Lshortfile)
}
