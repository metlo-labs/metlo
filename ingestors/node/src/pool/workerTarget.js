const { parentPort } = require("node:worker_threads")
// const { http } = require('follow-redirects');
const axios = require("axios")

parentPort.on('message', ({ data: postData, host, key }) => {
    axios({
        method: 'post',
        url: host,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': key
        },
        data: postData
    }).catch((error) => {
        console.warn("Encountered an error with metlo ingestor.\nError: ", error.message);
    }).finally(() => {
        parentPort.postMessage("done")
    });
});