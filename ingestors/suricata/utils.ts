import { ALERT, RESPONSE, HOST, conns } from "./interface";
import axios from "axios";

export function compileHost(jsonmsg: any, http_meta: Record<string, conns>) {
  // Get Response and Request headers from json blob
  const resp_headers = jsonmsg.http.response_headers;
  const req_headers = jsonmsg.http.request_headers;
  const host: HOST = {
    ...jsonmsg,
    request_headers: req_headers,
    response_headers: resp_headers,
  };
  // store flow metadata. Each connection in a pipeline comes sequentially
  // Store them sequentially
  if (host.flow_id in http_meta) {
    http_meta[host.flow_id].metas.push({
      timestamp: host.timestamp,
      metadata: host,
    });
  } else {
    http_meta[host.flow_id] = {
      flowId: host.flow_id,
      metas: [
        {
          timestamp: host.timestamp,
          metadata: host,
        },
      ],
    };
  }
}

export function pushAlert(resp: RESPONSE, url: string) {
  axios
    .post(url, {
      data: resp,
    })
    .then((res) => {
      console.log("Pushed up a request");
    })
    .catch((error) => {
      console.error(error);
    });
}

export function prepareResponse(
  alert: ALERT,
  meta: {
    timestamp: string;
    metadata: HOST;
  }
) {
  // Get source for the request
  // Compile the entire address from protocol, hostname, and url
  let remote_complete_url = new URL(
    alert.app_proto + "://" + alert.http.hostname + alert.http.url
  );
  // Get destination for the request
  // Compile the entire address from protocol, source_ip
  // Source ip is a local ip, so can't be accessed from the net, only from the internal
  let src_complete_url = new URL(alert.app_proto + "://" + alert.src_ip);
  const resp: RESPONSE = {
    request: {
      url: {
        base_url: src_complete_url.href,
        path: src_complete_url.pathname,
        parameters: Array.from(src_complete_url.searchParams).map(
          ([key, val]) => ({ name: key, value: val })
        ),
      },
      method: alert.http.http_method,
      headers: meta?.metadata.request_headers || [],
      body: alert.http.http_request_body_printable || null,
    },
    response: {
      url: remote_complete_url.href,
      status: alert.http.status,
      headers: meta?.metadata.response_headers || [],
      body: alert.http.http_request_body_printable || null,
    },
    meta: {
      environment: "production",
      incoming: true,
      source: alert.src_ip,
      source_port: alert.src_port,
      destination: alert.dest_ip,
      destination_port: alert.dest_port,
    },
  };
  return resp;
}
