package metloapi

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/metlo-labs/metlo/ingestors/govxlan/utils"
	"github.com/sirupsen/logrus"
)

type Metlo struct {
	mu        sync.Mutex
	ts        []int64
	rps       int
	metloHost string
	metloKey  string
	traceChan chan MetloTrace
}

const MetloDefaultRPS int = 10

func sendTraceWorker(traceChan chan MetloTrace, metloHost string, metloKey string) {
	for data := range traceChan {
		json, err := json.Marshal(data)
		if err != nil {
			log.Fatal(err)
		}
		req, err := http.NewRequest("POST", metloHost, bytes.NewBuffer(json))
		if err != nil {
			utils.Log.WithError(err).Debug("Error Building Request.")
			return
		}
		req.Header.Add("Content-Type", "application/json")
		req.Header.Add("Authorization", metloKey)
		client := http.DefaultClient
		resp, err := client.Do(req)
		if err != nil {
			utils.Log.WithError(err).Debug("Error Sending Request.")
		}
		if resp.StatusCode >= 400 {
			message, _ := io.ReadAll(resp.Body)
			utils.Log.WithFields(logrus.Fields{
				"Code":    resp.Status,
				"Message": string(message),
			}).Debug("Error Sending Request.")
		} else {
			utils.Log.Trace("Sent Request.")
		}
		resp.Body.Close()
	}
}

func InitMetlo(metloHost string, metloKey string, rps int) *Metlo {
	inst := &Metlo{
		ts:        make([]int64, 0, rps),
		rps:       rps,
		metloHost: metloHost + "/api/v1/log-request/single",
		metloKey:  metloKey,
		traceChan: make(chan MetloTrace),
	}
	for i := 0; i < 5; i++ {
		go sendTraceWorker(inst.traceChan, inst.metloHost, inst.metloKey)
	}
	return inst
}

func (m *Metlo) Send(data MetloTrace) {
	m.traceChan <- data
}

func (m *Metlo) Allow() bool {
	m.mu.Lock()
	tmp_ts := make([]int64, 0, 10)
	now := time.Now()
	curr := now.UTC().UnixMilli()
	if len(m.ts) != 0 {
		for x := 0; x < len(m.ts); x++ {
			if (curr - m.ts[x]) <= 1000 {
				tmp_ts = append(tmp_ts, m.ts[x])
			}
		}
	}
	m.ts = tmp_ts
	if len(m.ts) < m.rps {
		m.ts = append(m.ts, curr)
		m.mu.Unlock()
		return true
	}
	m.mu.Unlock()
	return false
}

func (m *Metlo) Shutdown() {
	close(m.traceChan)
}
