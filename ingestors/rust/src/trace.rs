struct KeyVal {
    name: String,
    value: String,
}

struct Url {
    host: String,
    path: String,
    parameters: Vec<KeyVal>,
}

struct Request {
    method: String,
    url: Url,
    headers: Vec<KeyVal>,
    body: String,
}

struct Response {
    status: u16,
    headers: Vec<KeyVal>,
    body: String,
}

struct Meta {
    environment: String,
    incoming: bool,
    source: String,
    sourcePort: u16,
    destination: String,
    destinationPort: u16,
}

pub struct ApiTrace {
    request: Request,
    response: Response,
    meta: Meta,
}

pub struct ProcessTraceRes {
    sqli: bool,
    xss: bool,
    block: bool,
}
