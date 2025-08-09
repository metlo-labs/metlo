use std::env;

use deadpool_postgres::{Config, ManagerConfig, Pool as PostgresPool, RecyclingMethod};
use deadpool_redis::{Config as RedisConfig, Pool as RedisPool, Runtime};
use tokio_postgres::NoTls;
use url::Url;

#[derive(Clone)]
pub struct AppState {
    pub db_pool: PostgresPool,
    pub redis_pool: RedisPool,
    pub encryption_key: String,
}

impl AppState {
    pub async fn make_app_state() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let db_conn_string =
            env::var("DB_URL").map_err(|e| format!("Error getting DB_URL: {}", e))?;
        let redis_url =
            env::var("REDIS_URL").map_err(|e| format!("Error getting REDIS_URL: {}", e))?;
        let encryption_key = env::var("ENCRYPTION_KEY")
            .map_err(|e| format!("Error getting ENCRYPTION_KEY: {}", e))?;

        let db_url = Url::parse(&db_conn_string)?;

        let mut db_config = Config::new();
        db_config.user = Some(db_url.username().to_string()).filter(|e| !e.is_empty());
        db_config.dbname = Some(db_url.path().to_string())
            .map(|e| e.trim_start_matches('/').to_string())
            .filter(|e| !e.is_empty());
        db_config.host = db_url.host().map(|e| e.to_string());
        db_config.port = db_url.port();
        db_config.manager = Some(ManagerConfig {
            recycling_method: RecyclingMethod::Fast,
        });
        let db_pool = db_config.create_pool(None, NoTls).unwrap();
        db_pool.resize(16);

        let redis_config = RedisConfig::from_url(redis_url);
        let redis_pool = redis_config.create_pool(Some(Runtime::Tokio1)).unwrap();
        redis_pool.resize(4);

        Ok(AppState {
            db_pool,
            redis_pool,
            encryption_key,
        })
    }
}
