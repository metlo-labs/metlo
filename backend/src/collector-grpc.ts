import { AppDataSource } from "data-source";
import { authCheck } from "grpc/auth";
import { MetloConfig } from "models/metlo-config";
import { getRepoQB } from "services/database/utils";
import { LogRequestService } from "services/log-request";
import { populateMetloConfig } from "services/metlo-config";
import { MetloContext } from "types";

const PROTO_PATH = "./src/grpc/proto/originalTraces.proto";
const fs = require('fs');

let grpc = require("@grpc/grpc-js");
let protoLoader = require("@grpc/proto-loader");

let packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

let eventsProto = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();

const { randomUUID } = require("node:crypto");

server.addService(eventsProto.EventService.service, {

    logSingleTrace: authCheck(async (call, callback) => {
        const traceParams = call.request;
        await LogRequestService.logRequest({}, traceParams)
        callback(null, { "status": "OK" });
    }),

    logBulkTrace: authCheck(async (call, callback) => {
        let traceParamsBatch = call.request;
        await LogRequestService.logRequestBatch({}, traceParamsBatch.items)
        callback(null, { "status": "OK" });
    }),

    ping: (call, callback) => {
        callback(null, { status: "DONE" })
    }
});


const main = async () => {
    try {
        const datasource = await AppDataSource.initialize()
        console.log(
            `Is AppDataSource Initialized? ${datasource.isInitialized ? "Yes" : "No"
            }`,
        )
        try {
            const ctx: MetloContext = {}
            const configString = fs.readFileSync("./metlo-config.yaml", "utf-8")
            const existingMetloConfig = await getRepoQB(ctx, MetloConfig)
                .select(["uuid"])
                .getRawOne()
            if (configString?.length > 0 && !existingMetloConfig) {
                await populateMetloConfig(ctx, configString)
            }
        } catch (err) { }
        //creating insecure connection without encryption
        server.bindAsync("0.0.0.0:8082", grpc.ServerCredentials.createInsecure(), (error, port) => {
            console.log(`Server listening at http://0.0.0.0:${port}`);
            server.start();
        });
    } catch (err) {
        console.error(`CatchBlockInsideMain: ${err}`)
    }
}

main().catch(err => {
    console.error(`Error in main try block: ${err}`)
})
