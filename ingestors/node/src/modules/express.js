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


        function compileInformation(_req, _res, responseBody) {
            const data = JSON.stringify({
                request: {
                    url: {
                        host: `${_req.socket.remoteAddress}:${_req.socket.remotePort}`,
                        path: _req.route.path,
                        parameters: Object.entries(_req.query).map(([k, v]) => ({ name: k, value: v })),
                    },
                    headers: Object.entries(_req.headers).map(([k, v]) => ({ name: k, value: v })),
                    body: _req.body || "No Body",
                    method: _req.method,
                },
                response: {
                    url: `${_req.socket.localAddress}:${_req.socket.localPort}`,
                    status: _res.statusCode,
                    headers: Object.entries(_res.getHeaders()).map(([k, v]) => ({ name: k, value: v })),
                    body: responseBody,
                },
                meta: {
                    environment: process.env.NODE_ENV,
                    incoming: true,
                    source: _req.socket.remoteAddress,
                    sourcePort: _req.socket.remotePort,                    
                    destination: _res.socket.localAddress,
                    destinationPort: _res.socket.localPort,
                }
            })

            METLO_DETAILS.pool.runTask({ host: METLO_DETAILS.host, key: METLO_DETAILS.key, data })
        }

        ritm(['express'], function (exports, name, basedir) {

            const original_send = exports.response.send
            const original_json = exports.response.json
            const original_sendFile = exports.response.sendFile

            function modifiedSend() {
                const resp = original_send.apply(this, arguments)
                compileInformation(this.req, resp, arguments[arguments.length - 1])
                return resp
            };

            function modifiedJSON() {
                this.send = original_send
                const resp = original_json.apply(this, arguments)
                const stack = new Error().stack;
                if (stack.includes("ServerResponse.modifiedSend")) {
                    // JSON was triggered by patched send
                    // Let send handle the complexities of communicating with metlo
                } else {
                    // JSON wasn't triggered by patched send. 
                    // Feel free to compile Information here.
                    compileInformation(this.req, resp, arguments[arguments.length - 1])
                }
                return resp;
            };

            function modifiedSendFile() {
                const resp = original_sendFile.apply(this, arguments)
                compileInformation(this.req, resp, arguments[arguments.length - 1])
                return resp
            };

            exports.response.send = modifiedSend;
            exports.response.json = modifiedJSON;
            exports.response.jsonp = modifiedJSON;
            exports.response.sendFile = modifiedSendFile

            return exports
        })
    }
}

module.exports = { init: initialize }