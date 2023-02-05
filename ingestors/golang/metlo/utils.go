package metlo

import (
	"net/http"
)

func TestInit(host string, apiKey string) {
	client := http.Client{}
	req, err := http.NewRequest("GET", host+"/api/v1/verify", nil)
	if err != nil {
		Log.Error("Could not perform validation request to metlo host")
	}
	req.Header.Set("Authorization", apiKey)
	res, err := client.Do(req)
	if err != nil {
		Log.Error(err)
	}
	if res.StatusCode == 404 {
		Log.Errorf("Metlo host at %s is unreachable.\n"+
			"Metlo host may be incorrect or metlo version may be old", host)
	} else if res.StatusCode == 401 {
		Log.Error("Could not validate Metlo API key.")
	} else if res.StatusCode != 200 {
		Log.Errorf("Problem encountered while validating connection to Metlo.\n"+
			"Received error code %d. Enabling by default", res.StatusCode)
	}
}
