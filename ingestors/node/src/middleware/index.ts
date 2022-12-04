import WorkerPool from "../pool"
import { MetloConfig } from "../types"

export interface InitMiddlewareParams extends MetloConfig {
  pool: WorkerPool
}

export let METLO_POOL: InitMiddlewareParams = {
  key: "",
  host: "",
  pool: null,
}

import ExpressModule from "./express"
import KoaModule from "./koa"
import FastifyModule from "./fastify"
import { getDependencies } from "../utils"

const nameToModule = {
  express: ExpressModule,
  koa: KoaModule,
  fastify: FastifyModule,
}

const InitMiddleware = (params: InitMiddlewareParams) => {
  METLO_POOL.key = params.key
  METLO_POOL.host = params.host
  METLO_POOL.pool = params.pool
  let dependencies = getDependencies()
  Object.entries(nameToModule).forEach(([name, module]) => {
    try {
      if (dependencies.includes(name)) module()
    } catch (err) {
      // pass
    }
  })
}

export default InitMiddleware
