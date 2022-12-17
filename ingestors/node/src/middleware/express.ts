import { METLO_POOL } from "."
import * as flatbuffers from "flatbuffers"
import { Trace } from "../flatbuffers/trace"
import { Meta, NVPair, Request, Response, Url } from "../flatbuffers/originalTraces_generated"
import { serializeBody } from "../utils/serializers"
const ritm = require("require-in-the-middle")

function versionCheck() {
  return true
}

const initialize = () => {
  if (!versionCheck()) {
    return
  }

  function compileInformation(_req, _res, responseBody) {
    const builder = new flatbuffers.Builder()

    //Request Creation
    const urlHost = builder.createString(_req.socket.remoteAddress)
    const urlPath = builder.createString(_req.baseUrl + _req.url)
    const reqUrlParams = Object.entries(_req.query).map(([k, v]) => {
      const name = builder.createString(k)
      const value = builder.createString(v.toString())
      NVPair.startNVPair(builder)
      NVPair.addName(builder, name)
      NVPair.addValue(builder, value)
      return NVPair.endNVPair(builder)
    })
    const urlParams = Url.createParametersVector(builder, reqUrlParams)
    const reqHeaderParams = Object.entries(_req.headers).map(([k, v]) => {
      const name = builder.createString(k)
      const value = builder.createString(v.toString())
      NVPair.startNVPair(builder)
      NVPair.addName(builder, name)
      NVPair.addValue(builder, value)
      return NVPair.endNVPair(builder)
    })
    Url.startUrl(builder)
    Url.addHost(builder, urlHost)
    Url.addPath(builder, urlPath)
    Url.addParameters(builder, urlParams)
    const url = Url.endUrl(builder)
    const reqHeaders = Request.createHeadersVector(builder, reqHeaderParams)
    const reqBody = builder.createString(serializeBody(_req.body || ""))
    const reqMethod = builder.createString(_req.method)

    Request.startRequest(builder)
    Request.addUrl(builder, url)
    Request.addHeaders(builder, reqHeaders)
    Request.addBody(builder, reqBody)
    Request.addMethod(builder, reqMethod)
    const req = Request.endRequest(builder)

    //Response Creation
    const resHeaderParams = Object.entries(_res.headers || {}).map(([k, v]) => {
      NVPair.startNVPair(builder)
      NVPair.addName(builder, builder.createString(k))
      NVPair.addValue(builder, builder.createString(v.toString()))
      return NVPair.endNVPair(builder)
    })
    const resHeader = Response.createHeadersVector(builder, resHeaderParams)
    const resBody = builder.createString(serializeBody(responseBody || ""))
    Response.startResponse(builder)
    Response.addStatus(builder, _res.statusCode)
    Response.addHeaders(builder, resHeader)
    Response.addBody(builder, resBody)
    const res = Response.endResponse(builder)

    // Meta Creation
    const metaEnv = builder.createString(process.env.NODE_ENV)
    const metaSource = builder.createString(_req.socket.remoteAddress)
    const metaSourcePort = builder.createString(_req.socket.remotePort)
    const metaDestination = builder.createString(_res.socket.localAddress)
    const metaDestinationPort = builder.createString(_res.socket.localPort)


    Meta.startMeta(builder)
    Meta.addEnvironment(builder, metaEnv)
    Meta.addIncoming(builder, true)
    Meta.addSource(builder, metaSource)
    Meta.addSourcePort(builder, metaSourcePort)
    Meta.addDestination(builder, metaDestination)
    Meta.addDestinationPort(builder, metaDestinationPort)
    const meta = Meta.endMeta(builder)

    Trace.startTrace(builder)
    Trace.addRequest(builder, req)
    Trace.addResponse(builder, res)
    Trace.addMeta(builder, meta)
    const trace = Trace.endTrace(builder)
    builder.finish(trace)
    const _trace = Trace.getRootAsTrace(builder.dataBuffer())
    console.log(_trace.request().method())
    const traceAsData = builder.asUint8Array()
    console.log(Trace.getRootAsTrace(new flatbuffers.ByteBuffer(traceAsData)).request().method())
    console.log(traceAsData.toString())
    console.log(process.env.NODE_ENV)
    // const data = ({
    //   request: {
    //     url: {
    //       host: _req.socket.remoteAddress,
    //       path: _req.baseUrl + _req.url,
    //       parameters: Object.entries(_req.query).map(([k, v]) => ({
    //         name: k,
    //         value: v,
    //       })),
    //     },
    //     headers: Object.entries(_req.headers).map(([k, v]) => ({
    //       name: k,
    //       value: v,
    //     })),
    //     body: _req.body || "No Body",
    //     method: _req.method,
    //   },
    //   response: {
    //     url: `${_req.socket.localAddress}:${_req.socket.localPort}`,
    //     status: _res.statusCode,
    //     headers: Object.entries(_res.getHeaders()).map(([k, v]) => ({
    //       name: k,
    //       value: v,
    //     })),
    //     body: responseBody,
    //   },
    //   meta: {
    //     environment: process.env.NODE_ENV,
    //     incoming: true,
    //     source: _req.socket.remoteAddress,
    //     sourcePort: _req.socket.remotePort,
    //     destination: _res.socket.localAddress,
    //     destinationPort: _res.socket.localPort,
    //     metloSource: "node/express",
    //   },
    // })
    // console.log(trace.)
    METLO_POOL.pool.runTask({
      host: METLO_POOL.host,
      key: METLO_POOL.key,
      data: traceAsData,
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
