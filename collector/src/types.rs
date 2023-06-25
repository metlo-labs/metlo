use uuid;

#[derive(Clone, Debug)]
pub struct CurrentUser {
    pub user_uuid: Option<uuid::Uuid>,
    pub organization_uuid: uuid::Uuid,
}
