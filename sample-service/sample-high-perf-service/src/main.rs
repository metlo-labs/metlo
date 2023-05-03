use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Error, Method, Request, Response, Server, StatusCode};
use rand::RngCore;
use std::collections::HashMap;
use std::convert::Infallible;
use std::net::SocketAddr;
use url::form_urlencoded;

async fn handle_req(req: Request<Body>) -> Result<Response<Body>, Infallible> {
    return match (req.method(), req.uri().path()) {
        (&Method::GET, "/rand-bytes") => {
            let num_bytes = req.uri().query().map_or(1000, |q| {
                let params = form_urlencoded::parse(q.as_bytes())
                    .into_owned()
                    .collect::<HashMap<String, String>>();
                params
                    .get("numBytes")
                    .map_or(0, |e| e.parse::<i64>().unwrap_or(1000))
            });
            let byte_iter = (0..(num_bytes / 1000)).map(|_| {
                let mut rng = rand::thread_rng();
                let mut bytes = vec![0u8; 1000];
                rng.fill_bytes(&mut bytes);
                bytes
            });
            let stream =
                futures_util::stream::iter(byte_iter.map(|e| Ok(e) as Result<Vec<u8>, Error>));
            Ok(Response::new(Body::wrap_stream(stream)))
        }
        (&Method::GET, "/hello") => Ok(Response::new(Body::from("Hello World"))),
        _ => {
            let mut response = Response::new(Body::empty());
            *response.status_mut() = StatusCode::NOT_FOUND;
            Ok(response)
        }
    };
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to install CTRL+C signal handler");
}

#[tokio::main]
async fn main() {
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    let make_svc = make_service_fn(|_conn| async { Ok::<_, Infallible>(service_fn(handle_req)) });
    let server = Server::bind(&addr).serve(make_svc);
    let graceful = server.with_graceful_shutdown(shutdown_signal());
    if let Err(e) = graceful.await {
        eprintln!("server error: {}", e);
    }
}
