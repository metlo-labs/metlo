import { METLO_POOL } from "."

const ritm = require("require-in-the-middle")

function versionCheck() {
  return true
}

const initialize = () => {
  if (!versionCheck()) {
    return
  }

  function compileInformation(_req, _res, responseBody) {
    const data = JSON.stringify({
      request: {
        url: {
          host: _req.socket.remoteAddress,
          path: _req.baseUrl + _req.url,
          parameters: Object.entries(_req.query).map(([k, v]) => ({
            name: k,
            value: v,
          })),
        },
        headers: Object.entries(_req.headers).map(([k, v]) => ({
          name: k,
          value: v,
        })),
        body: _req.body || "No Body",
        method: _req.method,
      },
      response: {
        url: `${_req.socket.localAddress}:${_req.socket.localPort}`,
        status: _res.statusCode,
        headers: Object.entries(_res.getHeaders()).map(([k, v]) => ({
          name: k,
          value: v,
        })),
        body: responseBody,
      },
      meta: {
        environment: process.env.NODE_ENV,
        incoming: true,
        source: _req.socket.remoteAddress,
        sourcePort: _req.socket.remotePort,
        destination: _res.socket.localAddress,
        destinationPort: _res.socket.localPort,
        metloSource: "node/express",
      },
    })

    METLO_POOL.pool.runTask({
      host: METLO_POOL.host,
      key: METLO_POOL.key,
      data,
    })
  }

  ritm(["express"], function (exports, name, basedir) {
    const original_send = exports.response.send
    const original_json = exports.response.json
    const original_sendFile = exports.response.sendFile

    function modifiedSend() {
      const resp = original_send.apply(this, arguments)
      compileInformation(this.req, resp, arguments[arguments.length - 1])
      return resp
    }

    function modifiedJSON() {
      this.send = original_send
      const resp = original_json.apply(this, arguments)
      const stack = new Error().stack
      if (stack.includes("ServerResponse.modifiedSend")) {
        // JSON was triggered by patched send
        // Let send handle the complexities of communicating with metlo
      } else {
        // JSON wasn't triggered by patched send.
        // Feel free to compile Information here.
        compileInformation(this.req, resp, arguments[arguments.length - 1])
      }
      return resp
    }

    function modifiedSendFile() {
      const resp = original_sendFile.apply(this, arguments)
      compileInformation(this.req, this, arguments[0])
      return resp
    }

    exports.response.send = modifiedSend
    exports.response.json = modifiedJSON
    exports.response.jsonp = modifiedJSON
    exports.response.sendFile = modifiedSendFile

    return exports
  })
}

export default initialize
