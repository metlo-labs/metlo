import { GCP_CONN } from "./gcp_apis"
import AsyncRetry from "async-retry"

export async function wait_for_global_operation(operation_id, conn: GCP_CONN) {
    return await AsyncRetry(
        async (f, at) => {
            let resp = await conn.get_global_operation_status(operation_id)
            if (resp[0].status === "DONE") {
                return resp
            } else {
                throw Error("Couldn't fetch global operation")
            }
        },
        { retries: 5 },
    )
}

export async function wait_for_regional_operation(
    operation_id,
    conn: GCP_CONN,
) {
    return await AsyncRetry(
        async (f, at) => {
            let resp = await conn.get_regional_operation_status(operation_id)

            if (resp[0].status === "DONE") {
                return resp
            } else {
                throw Error("Couldn't fetch regional operation")
            }
        },
        { retries: 5 },
    )
}

export async function wait_for_zonal_operation(operation_id, conn: GCP_CONN) {
    return await AsyncRetry(
        async (f, at) => {
            let resp = await conn.get_zonal_operation_status(operation_id)
            if (resp[0].status === "DONE") {
                return resp
            } else {
                throw Error("Couldn't fetch regional operation")
            }
        },
        { retries: 5 },
    )
}

export const GCP_REGIONS_SUPPORTED = [
    "us-west4-c",
    "us-west4-b",
    "us-west4-a",
    "us-west3-c",
    "us-west3-b",
    "us-west3-a",
    "us-west2-c",
    "us-west2-b",
    "us-west2-a",
    "us-west1-c",
    "us-west1-b",
    "us-west1-a",
    "us-south1-c",
    "us-south1-b",
    "us-south1-a",
    "us-east5-c",
    "us-east5-b",
    "us-east5-a",
    "us-east4-c",
    "us-east4-b",
    "us-east4-a",
    "us-east1-d",
    "us-east1-c",
    "us-east1-b",
    "us-central1-f",
    "us-central1-c",
    "us-central1-b",
    "us-central1-a",
]