mod api;
mod metlomiddle;
mod state;
mod types;
mod utils;

use std::net::SocketAddr;

use axum::{
    middleware,
    routing::{get, post},
    Router,
};
use dotenv::dotenv;

async fn health() -> &'static str {
    "OK"
}

async fn verify_api_key() -> &'static str {
    "OK"
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    dotenv().ok();

    let app_state = state::AppState::make_app_state().await?;

    let auth_routes = Router::new()
        .route("/api/v1/verify", get(verify_api_key))
        .route("/api/v2/verify", get(verify_api_key))
        .route(
            "/api/v2/log-request/batch",
            post(api::log_trace::log_trace_batch),
        )
        .route_layer(middleware::from_fn_with_state(
            app_state.clone(),
            metlomiddle::auth::auth,
        ));
    let no_auth_routes = Router::new().route("/api/v2", get(health));

    let app = Router::new()
        .merge(auth_routes)
        .merge(no_auth_routes)
        .with_state(app_state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 8081));
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();

    Ok(())
}
