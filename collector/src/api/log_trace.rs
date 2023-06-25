use axum::extract::{self, Extension};

use crate::types::{CurrentUser, ProcessedApiTrace};

pub async fn log_trace_batch(
    Extension(current_user): Extension<CurrentUser>,
    extract::Json(traces): extract::Json<Vec<ProcessedApiTrace>>,
) -> &'static str {
    println!("{:?}", traces);
    println!("{:?}", current_user);
    "OK"
}
