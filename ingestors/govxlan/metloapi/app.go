package metloapi

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"
)

type Metlo struct {
	mu        sync.Mutex
	ts        []int64
	rps       int
	metloHost string
	metloKey  string
}

const MetloDefaultRPS int = 10

func InitMetlo(metloHost string, metloKey string, rps int) *Metlo {
	inst := &Metlo{
		ts:        make([]int64, 0, rps),
		rps:       rps,
		metloHost: metloHost + "/api/v1/log-request/single",
		metloKey:  metloKey,
	}
	return inst
}

func (m *Metlo) Send(data MetloTrace) {
	json, err := json.Marshal(data)
	if err != nil {
		log.Fatal(err)
	}
	req, err := http.NewRequest("POST", m.metloHost, bytes.NewBuffer(json))
	if err != nil {
		// TODO log
		return
	}
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Authorization", m.metloKey)
	client := http.DefaultClient
	client.Do(req)
}

func (m *Metlo) Allow() bool {
	m.mu.Lock()
	tmp_ts := make([]int64, 0, 10)
	now := time.Now()
	curr := now.UTC().UnixMilli()
	if len(m.ts) == 0 {

	} else {
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
