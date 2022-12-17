export function serializeBody(body) {
    if (typeof (body) === "object") {
        if (Object.keys(body).length > 0) {
            return JSON.stringify(body)
        }
        return ""
    } else if (typeof (body) === "string") {
        return body
    } else {
        return body.toString()
    }
}

