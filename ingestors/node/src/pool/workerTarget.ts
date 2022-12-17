import { parentPort } from "node:worker_threads"
import axios from "axios";

parentPort.on('message', ({ data: postData, host, key }) => {
    // const data = Buffer.from(postData)
    //@ts-ignore
    console.log(`Length : ${data.length}`)
    axios({
        method: 'post',
        url: host,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Authorization': key
        },
        data: postData//(postData as Uint8Array)
    }).catch((error) => {
        console.warn("Encountered an error with metlo ingestor.\nError: ", error.message);
    }).finally(() => {
        parentPort.postMessage("done")
    });
});