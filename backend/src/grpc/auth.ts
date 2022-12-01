import { apiKeyVerificationInner } from "middleware/verify-api-key-middleware"
import { status } from "@grpc/grpc-js"

export function authCheck(fn) {
    return async (call, callback) => {
        const apiKey = call.metadata.get("authorization")
        if (apiKey.length > 0 && !!apiKey[0]) {
            console.log(apiKey[0])
            try {
                const keyValid = await apiKeyVerificationInner(undefined, apiKey[0])
                fn(call, callback)
            } catch (err) {
                callback({
                    code: status.UNAUTHENTICATED,
                    details: "API is unauthenticated",
                })
            }
        } else {
            callback({
                code: status.UNAUTHENTICATED,
                details: "API is unauthenticated",
            })
        }
    }
}
