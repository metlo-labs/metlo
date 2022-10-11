const { parentPort } = require('node:worker_threads');
const https = require('https')
parentPort.on('message', ({ data: postData, host, key }) => {
    console.log(postData)
    var _resp = https.request(host, {
        method: "POST", headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': key
        }
    }, (res) => {
        let data = '';

        console.log('Status Code:', res.statusCode);

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('Body: ', JSON.parse(data));
        });

    }).on("error", (err) => {
        console.log("Error: ", err.message);
    })

    _resp.write(postData)
    _resp.end();
    parentPort.postMessage("Sent Message");
});