import { parentPort } from "node:worker_threads"
import axios from "axios";

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