const os = require("node:os")
const Modules = require("./modules")
const WorkerPool = require("./pool");
const path = require("path")

const pool = new WorkerPool(os.cpus().length, './workerTarget.js');

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
    Modules({ host, key, pool })
}