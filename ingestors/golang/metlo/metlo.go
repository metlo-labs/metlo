package metlo

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"
)

type metlo struct {
	mu        sync.Mutex
	ts        []int64
	rps       int
	metloHost string
	metloKey  string
	disable   bool
}

const MetloDefaultRPS int = 10

func InitMetlo(metloHost string, metloKey string) *metlo {
	return InitMetloCustom(metloHost, metloKey, MetloDefaultRPS, false)
}

func InitMetloCustom(metloHost string, metloKey string, rps int, disable bool) *metlo {
	inst := &metlo{
		ts:        make([]int64, 0, rps),
		rps:       rps,
		metloHost: metloHost + "/api/v1/log-request/single",
		metloKey:  metloKey,
		disable:   disable,
	}
	return inst
}

func (m *metlo) Send(data any) {
	json, err := json.Marshal(data)
	if err != nil {
		log.Fatal(err)
	}
	req, err := http.NewRequest("POST", m.metloHost, bytes.NewBuffer(json))
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Authorization", m.metloKey)
	client := http.DefaultClient
	client.Do(req)
}

func (m *metlo) Allow() bool {
	if !m.disable {
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
			return true
		}
	}
	return false
}
