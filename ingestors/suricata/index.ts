import net from "net";
import fs from "fs";
import process from "process";
import { conns, EVENTS, HOST, ALERT, RESPONSE } from "./interface";

var server: net.Server;
var connections: Record<number, net.Socket> = {};
var http_meta: Record<string, conns> = {};

// Our socket
const SOCKETFILE = process.argv[process.argv.length - 1];

console.info("Socket: %s \n  Process: %s", SOCKETFILE, process.pid);

function createServer(socket: string) {
  console.log("Creating server.");
  var server = net
    .createServer(function (stream) {
      console.log("Connection acknowledged.");

      // Store all connections so we can terminate them if the server closes.
      // An object is better than an array for these.
      var self = Date.now();
      connections[self] = stream;
      stream.on("end", function () {
        console.log("Client disconnected.");
        delete connections[self];
      });

      // Messages are buffers. use toString
      stream.on("data", function (msg) {
        msg
          .toString()
          .split("\n")
          .filter((_msg) => !!_msg)
          .forEach((_msg, i, a) => {
            try {
              const jsonmsg = JSON.parse(_msg);
              if (EVENTS.HTTP === (jsonmsg["event_type"] as string)) {
                const resp_headers = jsonmsg.http.response_headers;
                const req_headers = jsonmsg.http.request_headers;
                const host: HOST = {
                  ...jsonmsg,
                  request_headers: req_headers,
                  response_headers: resp_headers,
                };
                if (host.flow_id in http_meta) {
                  http_meta[host.flow_id].metas.push({
                    timestamp: host.timestamp,
                    metadata: host,
                  });
                } else {
                  http_meta[host.flow_id] = {
                    flowId: host.flow_id,
                    metas: [
                      {
                        timestamp: host.timestamp,
                        metadata: host,
                      },
                    ],
                  };
                }
              }
              if (EVENTS.ALERT === (jsonmsg["event_type"] as string)) {
                const alert: ALERT = { ...jsonmsg };
                let meta = http_meta[alert.flow_id].metas.shift();
                let remote_complete_url = new URL(
                  alert.app_proto + "://" + alert.http.hostname + alert.http.url
                );
                let src_complete_url = new URL(
                  alert.app_proto + "://" + alert.src_ip
                );
                const resp: RESPONSE = {
                  request: {
                    src: {
                      base_url: src_complete_url.href,
                    },
                    dst: {
                      base_url: remote_complete_url.href.replace(
                        remote_complete_url.search,
                        ""
                      ),
                      parameters: Array.from(
                        remote_complete_url.searchParams.entries()
                      ).map((v) => ({ name: v[0], value: v[1] })),
                    },
                    method: alert.http.http_method,
                    headers: meta?.metadata.request_headers || [],
                    body: {
                      decoded: !alert.http.http_request_body_printable,
                      value: alert.http.http_request_body_printable,
                    },
                  },
                  response: {
                    status: alert.http.status,
                    src: {
                      base_url: remote_complete_url.href.replace(
                        remote_complete_url.search,
                        ""
                      ),
                    },
                    dst: {
                      base_url: src_complete_url.href,
                    },
                    headers: meta?.metadata.response_headers || [],
                    body: {
                      decoded: !alert.http.http_response_body_printable,
                      value: alert.http.http_request_body_printable,
                    },
                  },
                  meta: {
                    incoming: true,
                    source: alert.src_ip,
                    source_port: alert.src_port,
                    destination: alert.dest_ip,
                    destination_port: alert.dest_port,
                  },
                };
                // TODO : Get URL to send responses to.
                // Maybe use minimist or something similar to configure cli stuff
                console.log(JSON.stringify(resp));
              }
            } catch (err) {
              console.log(
                `///////////////////     ERROR      ///////////////////`
              );
              console.log(err);
              console.log(
                `///////////////////     MESSAGE      ///////////////////`
              );
              console.log(_msg);
            }
          });
      });
    })
    .listen(socket)
    .on("connection", function (socket) {
      console.log("Client connected.");
    });
  return server;
}

// check for failed cleanup
function main() {
  console.log("Checking for leftover socket.");
  fs.stat(SOCKETFILE, function (err, stats) {
    if (err) {
      // start server
      console.log("No leftover socket found.");
      server = createServer(SOCKETFILE);
      return;
    }
    // remove file then start server
    console.log("Removing leftover socket.");
    fs.unlink(SOCKETFILE, function (err) {
      if (err) {
        // This should never happen.
        console.error(err);
        process.exit(0);
      }
      server = createServer(SOCKETFILE);
      return;
    });
  });

  // close all connections when the user does CTRL-C
  function cleanup() {
    console.log(`\nClosing Connections\n`);
    if (Object.keys(connections).length) {
      Object.keys(connections).forEach((client) => {
        connections[parseInt(client)].end();
      });
      connections = [];
    }
    console.log(`\nTerminating server\n`);
    server.close();
    console.log(`\nClosing Process\n`);
    process.exit(0);
  }
  process.on("SIGINT", cleanup);
}

main();
