const ritm = require("require-in-the-middle")

function versionCheck() {
    return true
}

const METLO_DETAILS = {
    key: "",
    host: "",
    pool: null
}

function initialize({ key, host, pool }) {
    if (versionCheck()) {
        METLO_DETAILS.key = key
        METLO_DETAILS.host = host
        METLO_DETAILS.pool = pool


        async function compileInformation(ctx, next) {
            await next()
            const data = JSON.stringify(
                {
                    request: {
                        url: {
                            host: ctx.response.socket.remoteAddress,
                            path: ctx.path,
                            parameters: Object.entries(ctx.query).map(([k, v]) => ({ name: k, value: v })),
                        },
                        headers: Object.entries(ctx.request.headers).map(([k, v]) => ({ name: k, value: v })),
                        body: ctx.request.body || "",
                        method: ctx.request.method,
                    },
                    response: {
                        url: `${ctx.response.socket.localAddress}:${ctx.response.socket.localPort}`,
                        status: ctx.response.statusCode,
                        headers: Object.entries(ctx.response.headers).map(([k, v]) => ({ name: k, value: v })),
                        body: ctx.body,
                    },
                    meta: {
                        environment: process.env.NODE_ENV,
                        incoming: true,
                        source: ctx.request.socket.remoteAddress,
                        sourcePort: ctx.request.socket.remotePort,
                        destination: ctx.request.socket.localAddress,
                        destinationPort: ctx.request.socket.localPort,
                        metloSource: "node/koa"
                    }
                }
            )

            METLO_DETAILS.pool.runTask({ host: METLO_DETAILS.host, key: METLO_DETAILS.key, data })
        }

        compileInformation._meta_ = Symbol("metlo-koa")

        ritm(['koa'], function (exports, name, basedir) {

            // const module = exports.middlewares.find((fn, idx) => fn.has)
            //Find if our function exists
            // If it doesn't, then add it at 0th position
            // If it does, then take it out and move it down to our preffered location

            const original_use = exports.prototype.use

            function modifiedUse() {
                if ((idx = this.middleware.findIndex((fn, idx) => fn["_meta_"] !== undefined)) != -1) {
                    if (idx !== 0) {
                        this.middleware = (this.middleware)
                            // Remove function at same index where metlo middleware was found
                            .filter((_, _idx) => _idx !== idx)
                            // Set Metlo middleware at idx 0
                            .unshift(compileInformation)
                    }
                } else {
                    if (this.middleware.length === 0) {
                        this.middleware = [compileInformation]
                    } else {
                        Array.from(this.middleware).unshift([compileInformation])
                    }
                }
                let resp = original_use.apply(this, arguments)
                return resp
            }
            exports.prototype.use = modifiedUse

            return exports
        })
    }
}
module.exports = { init: initialize }