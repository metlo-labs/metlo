use std::str::FromStr;

use axum::{
    extract::State,
    http::{self, Request, StatusCode},
    middleware::Next,
    response::Response,
};
use base64::{engine::general_purpose, Engine as _};
use deadpool_redis::redis::{self, cmd};
use hmac::{Hmac, Mac};
use sha2::Sha512;
use uuid::Uuid;

use crate::{state::AppState, types::CurrentUser, utils::internal_error};

type HmacSha512 = Hmac<Sha512>;

pub async fn auth<B>(
    State(state): State<AppState>,
    mut req: Request<B>,
    next: Next<B>,
) -> Result<Response, (StatusCode, String)> {
    // Get Auth Header
    let auth_header = req
        .headers()
        .get(http::header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());
    let auth_header = if let Some(auth_header) = auth_header {
        auth_header
    } else {
        return Err((StatusCode::UNAUTHORIZED, "Unauthorized".to_string()));
    };

    // Generate Hash
    let mut mac =
        HmacSha512::new_from_slice(state.encryption_key.as_bytes()).map_err(internal_error)?;
    mac.update(auth_header.as_bytes());
    let hash_bytes = mac.finalize().into_bytes();
    let api_key_hash = general_purpose::STANDARD.encode(hash_bytes);

    // Check Redis for API Key Hash
    let mut redis_conn = state.redis_pool.get().await.map_err(internal_error)?;
    let mut redis_key = "collector_cached_api_key_".to_string();
    redis_key.push_str(&api_key_hash);
    let redis_key_str = redis_key.as_str();
    let redis_org_uuid: Option<String> = cmd("GET")
        .arg(&[redis_key_str])
        .query_async(&mut redis_conn)
        .await
        .map_err(internal_error)?;
    if let Some(unwrapped_org_uuid_str) = redis_org_uuid {
        if let Ok(org_uuid_res) = Uuid::from_str(unwrapped_org_uuid_str.as_str()) {
            req.extensions_mut().insert(CurrentUser {
                user_uuid: None,
                organization_uuid: org_uuid_res,
            });
            return Ok(next.run(req).await);
        }
    }

    // Check DB for API Key Hash
    let db_conn = state.db_pool.get().await.map_err(internal_error)?;
    let res = db_conn
        .query(
            "SELECT * FROM api_key WHERE \"apiKeyHash\" = $1::TEXT",
            &[&api_key_hash],
        )
        .await
        .map_err(internal_error)?;
    let org_uuid: Option<Uuid> = res.get(0).map(|e| e.get("organizationUuid"));

    if let Some(unwrapped_org_uuid) = org_uuid {
        req.extensions_mut().insert(CurrentUser {
            user_uuid: None,
            organization_uuid: unwrapped_org_uuid,
        });
        redis::pipe()
            .cmd("SET")
            .arg(&[redis_key_str, unwrapped_org_uuid.to_string().as_str()])
            .ignore()
            .cmd("EXPIRE")
            .arg(&[redis_key_str, "30"])
            .ignore()
            .query_async::<_, ()>(&mut redis_conn)
            .await
            .map_err(internal_error)?;
        Ok(next.run(req).await)
    } else {
        Err((StatusCode::UNAUTHORIZED, "Unauthorized".to_string()))
    }
}
