import { AppDataSource } from "data-source"
import Error500InternalServer from "errors/error-500-internal-server"
import { ApiEndpoint } from "models"
import { getQB } from "services/database/utils"
import { MetloContext } from "types"
import { RedisClient } from "utils/redis"

export const getHostGraphInner = async (ctx: MetloContext) => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  try {
    const endpoints: ApiEndpoint[] = await getQB(ctx, queryRunner)
      .from(ApiEndpoint, "endpoint")
      .getRawMany()
    let hosts = new Set<string>()
    let ipToHostsMap: { [key: string]: Set<string> } = {}
    let hostToSrcIPMap: { [key: string]: Set<string> } = {}
    let hostSrcIPToEndpoints: { [key: string]: Set<string> } = {}

    for (const e of endpoints) {
      hosts.add(e.host)
      for (const hostIP of Object.keys(e.hostIps)) {
        if (!ipToHostsMap[hostIP]) {
          ipToHostsMap[hostIP] = new Set<string>()
        }
        ipToHostsMap[hostIP].add(e.host)
      }
      for (const srcIP of Object.keys(e.srcIps)) {
        if (!hostToSrcIPMap[e.host]) {
          hostToSrcIPMap[e.host] = new Set<string>()
        }
        hostToSrcIPMap[e.host].add(srcIP)
        const hostSrcIPKey = [e.host, srcIP].join(",")
        if (!hostSrcIPToEndpoints[hostSrcIPKey]) {
          hostSrcIPToEndpoints[hostSrcIPKey] = new Set<string>()
        }
        hostSrcIPToEndpoints[hostSrcIPKey].add(e.uuid)
      }
    }

    let edges = []
    for (const [dstHost, srcIps] of Object.entries(hostToSrcIPMap)) {
      for (const ip of srcIps) {
        const srcHosts = ipToHostsMap[ip] || []
        edges.push(
          ...[...srcHosts].map(src => ({
            srcHost: src,
            dstHost: dstHost,
            numEndpoints: hostSrcIPToEndpoints[[dstHost, ip].join(",")].size,
          })),
        )
      }
    }

    return {
      hosts: [...hosts],
      edges,
    }
  } catch (err) {
    console.error(`Error in Get Endpoints service: ${err}`)
    throw new Error500InternalServer(err)
  } finally {
    await queryRunner.release()
  }
}

export const getHostGraph = async (ctx: MetloContext) => {
  const cacheRes = await RedisClient.getFromRedis(ctx, "endpointHostGraph")
  if (cacheRes) {
    return cacheRes
  }
  const realRes = await getHostGraphInner(ctx)
  await RedisClient.addToRedis(ctx, "endpointHostGraph", realRes, 30)
  return realRes
}
