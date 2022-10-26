const os = require("node:os")
const Modules = require("./modules")
const WorkerPool = require("./pool");
const path = require("path")

const pool = new WorkerPool(os.cpus().length, './workerTarget.js');
const endpoint = "api/v1/log-request/single"

function exit() {
    pool.close()
}

process.on('exit', exit);
process.on('SIGTERM', exit);

module.exports = function (key, host) {
    try {
        new URL(host)
    } catch (err) {
        console.error(err)
        throw new Error(`Couldn't load metlo. Host is not a proper url : ${host}`)
    }
    let metlo_host = host
    if (metlo_host[metlo_host.length - 1] != "/") {
        metlo_host += "/"
    }
    metlo_host += endpoint
    Modules({ host: metlo_host, key, pool })
}