import net from "net"
import fs from "fs"
import process from "process"
import { conns, EVENTS, ALERT, RecordHolderWithTimestamp } from "./interface"
import { program } from "commander"
import { prepareResponse, compileHost, pushAlert } from "./utils"
import ndjson from "ndjson"

var server: net.Server
var connections: Record<number, net.Socket> = {}
var http_meta: Record<string, RecordHolderWithTimestamp<conns>> = {}
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
              compileHost(jsonmsg, http_meta)
            }
            if (EVENTS.ALERT === (jsonmsg["event_type"] as string)) {
              alerts[flow_id] = { value: jsonmsg, timestamp: Date.now() }
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
    .requiredOption("-u, --url <url>", "URL for the webhook destination")
    .requiredOption("-k, --key <api_key>", "API Key for the webhook destination")
    .requiredOption("-s, --socket <socket_path>", "Socket file path")
  program.parse(process.argv)
  let options = program.opts()
  if (new URL(options.url)) {
    url = options.url
    api_key = options.key
    SOCKETFILE = options.socket
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
  Object.entries(http_meta).forEach(([k, v]) => {
    const flow_id = k
    // Find if both events are present in their respective things
    if (flow_id in alerts) {
      console.log("Got both together")

      let curr_alert = alerts[flow_id].value
      delete alerts[flow_id]
      let curr_http = v.value.metas.shift()

      // Get first metadata for the given connection.              
      let resp = prepareResponse(curr_alert, curr_http)
      pushAlert(resp, url, api_key)
    }
  })
}

function cleanup() {
  let new_meta = {}
  Object.entries(http_meta).filter((([k, v]) => ((Date.now() - v.timestamp) > msCleanupTimeout))).forEach(([k, v]) => { new_meta[k] = v })
  console.log(`Size diff ${Object.keys(new_meta).length - Object.keys(http_meta).length}`)
  http_meta = new_meta

  let new_alerts = {}
  Object.entries(alerts).filter((([k, v]) => ((Date.now() - v.timestamp) > msCleanupTimeout))).forEach(([k, v]) => { new_meta[k] = v })
  console.log(`Size diff ${Object.keys(new_alerts).length - Object.keys(alerts).length}`)
  alerts = new_alerts
}

setInterval(processAlerts, msSendTimeout)
setInterval(cleanup, msCleanupTimeout)

process.title = "METLO"

main()
