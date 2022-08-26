import net from "net"
import fs from "fs"
import process from "process"
import { conns, EVENTS, ALERT } from "./interface"
import { program } from "commander"
import { prepareResponse, compileHost, pushAlert } from "./utils"

var server: net.Server
var connections: Record<number, net.Socket> = {}
var http_meta: Record<string, conns> = {}

var url = ""
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

      // Messages are buffers. use toString
      stream.on("data", function (msg) {
        msg
          .toString()
          .split("\n")
          .filter(_msg => !!_msg)
          .forEach((_msg, i, a) => {
            try {
              const jsonmsg = JSON.parse(_msg)
              if (EVENTS.HTTP === (jsonmsg["event_type"] as string)) {
                compileHost(jsonmsg, http_meta)
              }
              if (EVENTS.ALERT === (jsonmsg["event_type"] as string)) {
                // compileAlert(jsonmsg);
                const alert: ALERT = jsonmsg
                // Get first metadata for the given connection.
                let meta = http_meta[alert.flow_id].metas.shift()
                if (meta) {
                  let resp = prepareResponse(alert, meta)
                  pushAlert(resp, url)
                }
              }
            } catch (err) {
              console.log(
                `///////////////////     ERROR      ///////////////////`,
              )
              console.log(err)
              console.log(
                `///////////////////     MESSAGE      ///////////////////`,
              )
              console.log(_msg)
            }
          })
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
    .requiredOption("-s, --socket <socket_path>", "Socket file path")
  program.parse(process.argv)
  let options = program.opts()
  if (new URL(options.url)) {
    url = options.url
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

main()
