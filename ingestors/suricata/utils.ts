import { ALERT, RESPONSE, HOST, conns, RecordHolderWithTimestamp } from "./interface"
import axios from "axios"

export function compileHost(jsonmsg: any, http_meta: Record<string, RecordHolderWithTimestamp<conns>>) {
  // Get Response and Request headers from json blob
  const resp_headers = jsonmsg.http.response_headers
  const req_headers = jsonmsg.http.request_headers
  const host: HOST = {
    ...jsonmsg,
    request_headers: req_headers,
    response_headers: resp_headers,
  }
  // store flow metadata. Each connection in a pipeline comes sequentially
  // Store them sequentially
  if (host.flow_id in http_meta) {
    http_meta[host.flow_id].value.metas.push({
      timestamp: host.timestamp,
      metadata: host,
    })
    http_meta[host.flow_id].timestamp = Date.now()
  } else {
    http_meta[host.flow_id] = {
      timestamp: Date.now(),
      value: {
        flowId: host.flow_id,
        metas: [
          {
            timestamp: host.timestamp,
            metadata: host,
          },
        ]
      },
    }
  }
}

export function pushAlert(resp: RESPONSE, url: string, api_key: string) {
  axios
    .post(url, {
      ...resp,
    }, { headers: { "Authorization": api_key } })
    .then(res => {
      console.log("Pushed up a request")
    })
    .catch(error => {
      console.error(error)
    })
}

export function prepareResponse(
  alert: ALERT,
  meta: {
    timestamp: string
    metadata: HOST
  },
) {
  // Get source for the request
  // Compile the entire address from protocol, hostname, and url
  let destination_url = new URL(
    alert.app_proto + "://" + alert.http.hostname + alert.http.url,
  )
  // Get destination for the request
  // Compile the entire address from protocol, source_ip
  // Destional ip is a source ip in this case, since this alert is processed at response sending time. 
  let source_url = new URL(alert.app_proto + "://" + alert.dest_ip)
  const resp: RESPONSE = {
    request: {
      url: {
        host: destination_url.host,
        path: destination_url.pathname,
        parameters: Array.from(destination_url.searchParams).map(
          ([key, val]) => ({ name: key, value: val }),
        ),
      },
      method: alert.http.http_method,
      headers: meta?.metadata.request_headers || [],
      body: alert.http.http_request_body_printable || null,
    },
    response: {
      url: source_url.href,
      status: alert.http.status,
      headers: meta?.metadata.response_headers || [],
      body: alert.http.http_response_body_printable || null,
    },
    meta: {
      environment: "production",
      incoming: true,
      source: alert.src_ip,
      sourcePort: alert.src_port,
      destination: alert.dest_ip,
      destinationPort: alert.dest_port,
    },
  }
  return resp
}