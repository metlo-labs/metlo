import { getPathTokens } from "@common/utils"
import { ApiTrace } from "models"
import { getRepository } from "services/database/utils"
import { MetloContext } from "types"

const TRACE_LIMIT = 10_000
const THRESHOLD = 0.1

const getCounterMap = (traces: ApiTrace[]) => {
  const counterMap = {}
  for (const trace of traces) {
    const pathTokens = getPathTokens(trace.path)
    for (let i = 0; i < pathTokens.length; i++) {
      const token = pathTokens[i]
      const pos = i.toString()
      if (!counterMap[pos]) {
        counterMap[pos] = {}
      }
      if (!counterMap[pos][token]) {
        counterMap[pos][token] = 1
      } else {
        counterMap[pos][token] += 1
      }
    }
  }
  return counterMap
}

const getDistinctPaths = (
  counterMap: any,
  traces: ApiTrace[],
  numTraces: number,
): Record<string, number> => {
  const distinctPaths: Record<string, number> = {}
  for (const trace of traces) {
    const pathTokens = getPathTokens(trace.path)
    let path = ""
    let totalPercent = 0
    const numTokens = pathTokens.length
    let paramNum = 1
    for (let i = 0; i < numTokens; i++) {
      const token = pathTokens[i]
      const pos = i.toString()
      const tokenPercentOccurence = counterMap[pos][token] / numTraces
      totalPercent += tokenPercentOccurence
      if (tokenPercentOccurence < THRESHOLD) {
        path += `/{param${paramNum++}}`
      } else {
        path += `/${token}`
      }
    }
    const avgTotalPctOccurence = totalPercent / numTokens
    if (!distinctPaths[path] || avgTotalPctOccurence > distinctPaths?.[path]) {
      distinctPaths[path] = avgTotalPctOccurence
    }
  }
  return distinctPaths
}

export const getTopSuggestedPaths = async (
  ctx: MetloContext,
  endpointId: string,
): Promise<string[]> => {
  const traces = await getRepository(ctx, ApiTrace).findAndCount({
    select: {
      path: true,
    },
    where: {
      apiEndpointUuid: endpointId,
    },
    take: TRACE_LIMIT,
    order: {
      createdAt: "DESC",
    },
  })
  const counterMap = getCounterMap(traces[0])
  const distinctPaths = getDistinctPaths(counterMap, traces[0], traces[1])
  const sorted = Object.keys(distinctPaths).sort(
    (a, b) => distinctPaths[b] - distinctPaths[a],
  )
  return sorted.slice(0, 100)
}
