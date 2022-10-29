import net from "net"
import fs from "fs"
import process from "process"
import { conns, EVENTS, ALERT, RecordHolderWithTimestamp } from "./interface"
import { program } from "commander"
import { prepareResponse, compileHost, pushAlert } from "./utils"
import ndjson from "ndjson"
import { Mutex, MutexInterface } from "async-mutex"
import dotenv from "dotenv"


var server: net.Server
var connections: Record<number, net.Socket> = {}
var http_meta: Record<string, RecordHolderWithTimestamp<conns>> = {}
const httpMutex: MutexInterface = new Mutex()
const alertMutex: MutexInterface = new Mutex()
var alerts: Record<string, RecordHolderWithTimestamp<ALERT>> = {}
const msSendTimeout = 10
// Just offset by enough to not conflict with timeout
const msCleanupTimeout = 10011


var url = ""
var api_key = ""
// Our socket
var SOCKETFILE = ""

function createServer(socket: string) {
  console.log("Creating server.")
  var server = net
    .createServer(function (stream) {
      console.log("Connection acknowledged.")

      // Store all connections so we can terminate them if the server closes.
      // An object is better than an array for these.
      var self = Date.now()
      connections[self] = stream
      stream.on("end", function () {
        console.log("Client disconnected.")
        delete connections[self]
      })

      stream.pipe(ndjson.parse())
        .on('data', function (obj) {
          // obj is a javascript object
          try {

            const jsonmsg = obj
            const flow_id = jsonmsg.flow_id

            if (EVENTS.HTTP === (jsonmsg["event_type"] as string)) {
              httpMutex.acquire().then((release) => {
                compileHost(jsonmsg, http_meta)
                release()
              })
            }
            if (EVENTS.ALERT === (jsonmsg["event_type"] as string)) {
              alertMutex.acquire().then((release) => {
                alerts[flow_id] = { value: jsonmsg, timestamp: Date.now() }
                release()
              })
            }
          } catch (err) {
            console.log(
              `///////////////////     ERROR      ///////////////////`,
            )
            console.log(err)
            console.log(
              `///////////////////     MESSAGE      ///////////////////`,
            )
            console.log(JSON.stringify(obj))
          }
        })


    })
    .listen(socket)
    .on("connection", function (socket) {
      console.log("Client connected.")
    })
  return server
}

// check for failed cleanup
function main() {
  // Set cli options
  program
    .name("AWS-Suricata Ingestor")
    .description("Basic CLI app to ingest data from suricata on AWS")
  program
    .requiredOption("-s, --socket <socket_path>", "Socket file path")
    .option("-e, --env <path>", "Env file path")
    .option("-u, --url <url>", "URL for the webhook destination")
    .option("-k, --key <api_key>", "API Key for the webhook destination")
  program.parse(process.argv)
  let options = program.opts()
  SOCKETFILE = options.socket
  if (options.url && new URL(options.url)) {
    url = options.url + "/api/v1/log-request/single"
    api_key = options.key
  } else if (options.env) {
    dotenv.config({ path: options.env })
    if (process.env.METLO_ADDR && process.env.METLO_KEY) {
      url = process.env.METLO_ADDR + "/api/v1/log-request/single"
      api_key = process.env.METLO_KEY
    }
  } else {
    throw new Error("Neither url/key or env params defined. Must choose either of options")
  }

  console.info("Socket: %s \n  Process: %s", SOCKETFILE, process.pid)
  console.log("Checking for leftover socket.")
  fs.stat(SOCKETFILE, function (err, stats) {
    if (err) {
      // start server
      console.log("No leftover socket found.")
      server = createServer(SOCKETFILE)
      return
    }
    // remove file then start server
    console.log("Removing leftover socket.")
    fs.unlink(SOCKETFILE, function (err) {
      if (err) {
        // This should never happen.
        console.error(err)
        process.exit(0)
      }
      server = createServer(SOCKETFILE)
      return
    })
  })

  // close all connections when the user does CTRL-C
  function cleanup() {
    console.log(`\nClosing Connections\n`)
    if (Object.keys(connections).length) {
      Object.keys(connections).forEach(client => {
        connections[parseInt(client)].end()
      })
      connections = []
    }
    console.log(`\nTerminating server\n`)
    server.close()
    console.log(`\nClosing Process\n`)
    process.exit(0)
  }
  process.on("SIGINT", cleanup)
}

function processAlerts() {
  httpMutex.acquire().then((release) => {
    Object.entries(http_meta).forEach(([k, v]) => {
      const flow_id = k
      // Find if both events are present in their respective things
      alertMutex.acquire().then((alertRelease) => {
        if (flow_id in alerts) {
          let curr_alert = alerts[flow_id].value
          delete alerts[flow_id]
          let curr_http = v.value.metas.shift()

          // Get first metadata for the given connection.              
          let resp = prepareResponse(curr_alert, curr_http)
          pushAlert(resp, url, api_key)
        }
        alertRelease()
      })
    })
    release()
  })
}

function cleanupData() {
  httpMutex.acquire().then((release) => {
    let new_meta = {}
    Object.entries(http_meta).filter((([k, v]) => ((Date.now() - v.timestamp) > msCleanupTimeout))).forEach(([k, v]) => { new_meta[k] = v })
    http_meta = new_meta
    release()
  })

  alertMutex.acquire().then((release) => {
    let new_alerts = {}
    Object.entries(alerts).filter((([k, v]) => ((Date.now() - v.timestamp) > msCleanupTimeout))).forEach(([k, v]) => { new_alerts[k] = v })
    alerts = new_alerts
    release()
  })
}

setInterval(processAlerts, msSendTimeout)
setInterval(cleanupData, msCleanupTimeout)

process.title = "METLO"

main()
