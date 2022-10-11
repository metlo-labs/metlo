var shimmer = require('shimmer');
var expr_resp = require('express/lib/response');
var http = require('https')
var os = require('node:os');

var WorkerPool = require('./pool');


const pool = new WorkerPool(os.cpus().length, './workerTarget.js');

function exit() {
    pool.close()
}

process.on('exit', exit);
process.on('SIGTERM', exit);


var metloDetails = {
    key: null,
    host: null
}


function compileInformation(_req, _res, responseBody) {
    const data = JSON.stringify({
        request: {
            url: {
                host: _req.hostname,
                path: _req.route.path,
                parameters: _req.query,
            },
            headers: _req.headers,
            body: _req.body || "No Body",
            method: _req.method,
        },
        response: {
            url: `${_req.socket.remoteAddress}:${_req.socket.remotePort}`,
            status: _res.statusCode,
            headers: _res.getHeaders(),
            body: responseBody,
        },
        meta: {
            environment: "production",
            incoming: true,
            source: _req.socket.remoteAddress,
            sourcePort: _req.socket.remotePort,
            // TODO : Add destination
            destination: "server.hostname",
            destinationPort: "server.port",
        }
    })

    pool.runTask({ host: metloDetails.host, key: metloDetails.key, data }, (err, result) => {
        console.log(err, result);
    })
}

shimmer.wrap(expr_resp, 'send', function (original) {
    return function () {
        var returned = original.apply(this, arguments)
        compileInformation(this.req, returned, arguments[arguments.length - 1])
        return returned;
    };
});

shimmer.wrap(expr_resp, 'sendFile', function (original) {
    return function () {
        var returned = original.apply(this, arguments)
        compileInformation(this.req, returned, JSON.stringify(arguments[arguments.length - 1]))
        return returned;
    };
});

module.exports = function (apiKey, metloHost) {
    metloDetails.host = metloHost
    metloDetails.key = apiKey
}