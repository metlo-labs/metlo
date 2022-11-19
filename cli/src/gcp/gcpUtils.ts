import { GCP_CONN } from "./gcp_apis"
import AsyncRetry from "async-retry"

export async function wait_for_global_operation(operation_id, conn: GCP_CONN, retries = 5) {
    return await AsyncRetry(
        async (f, at) => {
            let resp = await conn.get_global_operation_status(operation_id)
            if (resp[0].status === "DONE") {
                return resp
            } else {
                throw Error("Couldn't fetch global operation")
            }
        },
        { retries },
    )
}

export async function wait_for_regional_operation(operation_id, conn: GCP_CONN, retries = 5) {
    return await AsyncRetry(
        async (f, at) => {
            let resp = await conn.get_regional_operation_status(operation_id)

            if (resp[0].status === "DONE") {
                return resp
            } else {
                throw Error("Couldn't fetch regional operation")
            }
        },
        { retries },
    )
}

export async function wait_for_zonal_operation(operation_id, conn: GCP_CONN, retries = 5) {
    return await AsyncRetry(
        async (f, at) => {
            let resp = await conn.get_zonal_operation_status(operation_id)
            if (resp[0].status === "DONE") {
                return resp
            } else {
                throw Error("Couldn't fetch regional operation")
            }
        },
        { retries },
    )
}

export const GCP_REGIONS_SUPPORTED = [
    "us-east1-b",
    "us-east1-c",
    "us-east1-d",
    "us-east4-c",
    "us-east4-b",
    "us-east4-a",
    "us-central1-c",
    "us-central1-a",
    "us-central1-f",
    "us-central1-b",
    "us-west1-b",
    "us-west1-c",
    "us-west1-a",
    "europe-west4-a",
    "europe-west4-b",
    "europe-west4-c",
    "europe-west1-b",
    "europe-west1-d",
    "europe-west1-c",
    "europe-west3-c",
    "europe-west3-a",
    "europe-west3-b",
    "europe-west2-c",
    "europe-west2-b",
    "europe-west2-a",
    "asia-east1-b",
    "asia-east1-a",
    "asia-east1-c",
    "asia-southeast1-b",
    "asia-southeast1-a",
    "asia-southeast1-c",
    "asia-northeast1-b",
    "asia-northeast1-c",
    "asia-northeast1-a",
    "asia-south1-c",
    "asia-south1-b",
    "asia-south1-a",
    "australia-southeast1-b",
    "australia-southeast1-c",
    "australia-southeast1-a",
    "southamerica-east1-b",
    "southamerica-east1-c",
    "southamerica-east1-a",
    "asia-east2-a",
    "asia-east2-b",
    "asia-east2-c",
    "asia-northeast2-a",
    "asia-northeast2-b",
    "asia-northeast2-c",
    "asia-northeast3-a",
    "asia-northeast3-b",
    "asia-northeast3-c",
    "asia-south2-a",
    "asia-south2-b",
    "asia-south2-c",
    "asia-southeast2-a",
    "asia-southeast2-b",
    "asia-southeast2-c",
    "australia-southeast2-a",
    "australia-southeast2-b",
    "australia-southeast2-c",
    "europe-central2-a",
    "europe-central2-b",
    "europe-central2-c",
    "europe-north1-a",
    "europe-north1-b",
    "europe-north1-c",
    "europe-southwest1-a",
    "europe-southwest1-b",
    "europe-southwest1-c",
    "europe-west6-a",
    "europe-west6-b",
    "europe-west6-c",
    "europe-west8-a",
    "europe-west8-b",
    "europe-west8-c",
    "europe-west9-a",
    "europe-west9-b",
    "europe-west9-c",
    "me-west1-a",
    "me-west1-b",
    "me-west1-c",
    "northamerica-northeast1-a",
    "northamerica-northeast1-b",
    "northamerica-northeast1-c",
    "northamerica-northeast2-a",
    "northamerica-northeast2-b",
    "northamerica-northeast2-c",
    "southamerica-west1-a",
    "southamerica-west1-b",
    "southamerica-west1-c",
    "us-east5-a",
    "us-east5-b",
    "us-east5-c",
    "us-south1-a",
    "us-south1-b",
    "us-south1-c",
    "us-west2-a",
    "us-west2-b",
    "us-west2-c",
    "us-west3-a",
    "us-west3-b",
    "us-west3-c",
    "us-west4-a",
    "us-west4-b",
    "us-west4-c"
]

export const zoneToRegionMap = [
    {
        "imageZone": "us",
        "region": "us-east1"
    },
    {
        "imageZone": "us",
        "region": "us-east4"
    },
    {
        "imageZone": "us",
        "region": "us-central1"
    },
    {
        "imageZone": "us",
        "region": "us-west1"
    },
    {
        "imageZone": "eu",
        "region": "europe-west4"
    },
    {
        "imageZone": "eu",
        "region": "europe-west1"
    },
    {
        "imageZone": "eu",
        "region": "europe-west3"
    },
    {
        "imageZone": "eu",
        "region": "europe-west2"
    },
    {
        "imageZone": "asia",
        "region": "asia-east1"
    },
    {
        "imageZone": "asia",
        "region": "asia-southeast1"
    },
    {
        "imageZone": "asia",
        "region": "asia-northeast1"
    },
    {
        "imageZone": "asia",
        "region": "asia-south1"
    },
    {
        "imageZone": "asia",
        "region": "australia-southeast1"
    },
    {
        "imageZone": "us",
        "region": "southamerica-east1"
    },
    {
        "imageZone": "asia",
        "region": "asia-east2"
    },
    {
        "imageZone": "asia",
        "region": "asia-northeast2"
    },
    {
        "imageZone": "asia",
        "region": "asia-northeast3"
    },
    {
        "imageZone": "asia",
        "region": "asia-south2"
    },
    {
        "imageZone": "asia",
        "region": "asia-southeast2"
    },
    {
        "imageZone": "asia",
        "region": "australia-southeast2"
    },
    {
        "imageZone": "eu",
        "region": "europe-central2"
    },
    {
        "imageZone": "eu",
        "region": "europe-north1"
    },
    {
        "imageZone": "eu",
        "region": "europe-southwest1"
    },
    {
        "imageZone": "eu",
        "region": "europe-west6"
    },
    {
        "imageZone": "eu",
        "region": "europe-west8"
    },
    {
        "imageZone": "eu",
        "region": "europe-west9"
    },
    {
        "imageZone": "asia",
        "region": "me-west1"
    },
    {
        "imageZone": "us",
        "region": "northamerica-northeast1"
    },
    {
        "imageZone": "us",
        "region": "northamerica-northeast2"
    },
    {
        "imageZone": "us",
        "region": "southamerica-west1"
    },
    {
        "imageZone": "us",
        "region": "us-east5"
    },
    {
        "imageZone": "us",
        "region": "us-south1"
    },
    {
        "imageZone": "us",
        "region": "us-west2"
    },
    {
        "imageZone": "us",
        "region": "us-west3"
    },
    {
        "imageZone": "us",
        "region": "us-west4"
    },
]