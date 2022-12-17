import { Throttler } from "../utils/throttling"
import { METLO_POOL } from "."

const ritm = require("require-in-the-middle")

function versionCheck() {
  return true
}

const initialize = () => {
  if (!versionCheck()) {
    return
  }

  async function compileInformation(request, response, response_body) {
    const data = JSON.stringify({
      request: {
        url: {
          host: request.raw.socket.remoteAddress,
          path: request.url.split("?")[0],
          parameters: Object.entries(request.query).map(([k, v]) => ({
            name: k,
            value: v,
          })),
        },
        headers: Object.entries(request.headers).map(([k, v]) => ({
          name: k,
          value: v,
        })),
        body: request.body || "",
        method: request.method,
      },
      response: {
        url: `${response.raw.socket.localAddress}:${response.raw.socket.localPort}`,
        status: response.statusCode,
        headers: Object.entries(response.headers).map(([k, v]) => ({
          name: k,
          value: v,
        })),
        body: response_body,
      },
      meta: {
        environment: process.env.NODE_ENV,
        incoming: true,
        source: request.raw.socket.remoteAddress,
        sourcePort: request.raw.socket.remotePort,
        destination: response.raw.socket.localAddress,
        destinationPort: response.raw.socket.localPort,
        metloSource: "node/fastify",
      },
    })

    METLO_POOL.pool.runTask({
      host: METLO_POOL.host,
      key: METLO_POOL.key,
      data,
    })
  }

  ritm(["fastify"], function (exports, name, basedir) {
    const originalFastify = exports
    const throttler = new Throttler(METLO_POOL.rps)

    function modifiedFastify() {
      let fastifyInst = originalFastify.apply(this, arguments)
      fastifyInst.addHook("onSend", async (request, reply, payload) => {
        throttler.allow(() => { compileInformation(request, reply, payload) })
        return payload
      })
      return fastifyInst
    }
    exports = modifiedFastify

    return exports
  })
}

export default initialize
