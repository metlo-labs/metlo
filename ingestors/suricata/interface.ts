export interface conns {
  flowId: number
  metas: Array<{
    timestamp: string
    metadata: HOST
  }>
}

export enum EVENTS {
  ALERT = "alert",
  HTTP = "http",
}

export interface HEADERS {
  name: string
  value: string
}

export interface COMMON {
  timestamp: string
  flow_id: number
  in_iface: string
  event_type: string
  src_ip: string
  src_port: number
  dest_ip: string
  dest_port: number
  proto: string
  community_id: string
  tx_id: number
}

export interface HOST extends COMMON {
  http: Object
  request_headers: Array<HEADERS>
  response_headers: Array<HEADERS>
}

export interface ALERT extends COMMON {
  alert: {
    action: string
    gid: number
    signature_id: number
    rev: number
    signature: string
    category: string
    severity: number
  }
  tunnel: {
    src_ip: string
    src_port: number
    dest_ip: string
    dest_port: number
    proto: string
    depth: number
  }
  http: {
    hostname: string
    http_port: number
    url: string
    http_user_agent?: string
    http_content_type: string
    http_method: string
    protocol: string
    status: number
    length: number
    http_request_body_printable: string
    http_response_body_printable: string
    http_request_body: string
    http_response_body: string
  }
  files: [
    {
      filename: string
      sid: Array<any>
      gaps: boolean
      state: string
      stored: boolean
      size: number
      tx_id: number
    },
  ]
  app_proto: string
  flow: {
    pkts_toserver: number
    pkts_toclient: number
    bytes_toserver: number
    bytes_toclient: number
    start: string
  }
  payload: string
  payload_printable: string
  stream: number
  packet: string
  packet_info?: { linktype: number }
}

export interface RESPONSE {
  request: {
    url: {
      base_url: string
      path: string
      parameters: Array<HEADERS>
    }
    headers: Array<HEADERS>
    body?: string
    method: string
  }
  response: {
    url: string
    status: number
    headers: Array<HEADERS>
    body?: string
  }
  meta: {
    environment: "production"
    incoming: true
    source: string
    source_port: number
    destination: string
    destination_port: number
  }
}
