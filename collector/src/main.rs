mod api;
mod endpoint_tree;
mod metlomiddle;
mod state;
mod types;
mod utils;

use std::{net::SocketAddr, time::Duration};

use axum::{
    middleware,
    routing::{get, post},
    Router,
};
use dotenv::dotenv;

use endpoint_tree::refresh_endpoint_tree;
use lazy_static::lazy_static;
use serde_json::json;
use tokio::sync::RwLock;
use tokio::time;

lazy_static! {
    pub static ref ENDPOINT_TREE: RwLock<serde_json::Value> = RwLock::new(json!({}));
}

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

    let app_state_endpoint_tree = app_state.clone();
    refresh_endpoint_tree(app_state_endpoint_tree.clone()).await;
    tokio::task::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(300));
        loop {
            interval.tick().await;
            refresh_endpoint_tree(app_state_endpoint_tree.clone()).await;
        }
    });

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
