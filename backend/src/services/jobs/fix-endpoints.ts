import { AppDataSource } from "data-source"
import { ApiEndpoint, ApiTrace } from "models"
import { getEntityManager, getQB } from "services/database/utils"
import { updatePaths } from "services/get-endpoints/path-heuristic"
import { QueryRunner } from "typeorm"
import { MetloContext } from "types"
import countBy from "lodash/countBy"

enum TokenType {
  CONSTANT,
  PARAM,
}
const paramRegexp = new RegExp("{param[0-9]+}")
const validTokenRegexp = new RegExp("[A-Za-z-_]+")
const MAX_ANALYZE_TRACES = 20000
const MIN_ANALYZE_TRACES = 500
const MIN_CONST_RATIO = 0.3

const sanitizePath = (path: string) => {
  if (path.startsWith("/")) {
    path = path.slice(1)
  }
  if (path.endsWith("/")) {
    path = path.slice(0, path.length - 1)
  }
  return path
}

const fixEndpoint = async (
  ctx: MetloContext,
  endpoint: ApiEndpoint,
  queryRunner: QueryRunner,
): Promise<void> => {
  const traces = await getEntityManager(ctx, queryRunner).find(ApiTrace, {
    select: {
      path: true,
    },
    where: {
      apiEndpointUuid: endpoint.uuid,
    },
    order: {
      createdAt: "DESC",
    },
    take: MAX_ANALYZE_TRACES,
  })
  let currentEndpointPath = sanitizePath(endpoint.path)

  const currentEndpointTokens = currentEndpointPath.split("/")
  const currentEndpointTokenTypes = currentEndpointTokens.map(e =>
    e.match(paramRegexp) ? TokenType.PARAM : TokenType.CONSTANT,
  )
  const tokenizedTraces = traces
    .map(t => sanitizePath(t.path).split("/"))
    .filter(t => t.length == currentEndpointTokens.length)

  const getPaths = (
    tokenizedTraces: string[][],
    position: number,
    currParams: number,
  ) => {
    if (tokenizedTraces.length == 0) {
      return []
    }
    if (position >= tokenizedTraces[0].length) {
      return []
    }
    let validTokens: string[] = []
    if (currentEndpointTokenTypes[position] == TokenType.CONSTANT) {
      validTokens.push(currentEndpointTokens[position])
    } else if (tokenizedTraces.length >= MIN_ANALYZE_TRACES) {
      const firstTraceTokens = tokenizedTraces.map(e => e[position])
      const tokenCount = countBy(firstTraceTokens)
      validTokens = Object.entries(tokenCount)
        .filter(([token, count]) => {
          return (
            (count > tokenizedTraces.length * MIN_CONST_RATIO ||
              (count > 500 && count > tokenizedTraces.length * 0.1)) &&
            token.match(validTokenRegexp)
          )
        })
        .map(([token, count]) => token)
    }
    let paths: string[] = []
    if (validTokens.length == 0) {
      const nextPaths = getPaths(tokenizedTraces, position + 1, currParams + 1)
      if (nextPaths.length > 0) {
        paths = nextPaths.map(e => `/{param${currParams + 1}}${e}`)
      } else {
        paths = [`/{param${currParams + 1}}`]
      }
    } else {
      for (const validTok of validTokens) {
        const nextPaths = getPaths(
          tokenizedTraces.filter(e => e[position] == validTok),
          position + 1,
          currParams,
        )
        if (nextPaths.length > 0) {
          paths = paths.concat(nextPaths.map(e => `/${validTok}${e}`))
        } else {
          paths = paths.concat([`/${validTok}`])
        }
      }
    }
    return paths
  }

  const newPaths = getPaths(tokenizedTraces, 0, 0).filter(
    e => sanitizePath(e) != currentEndpointPath,
  )

  if (newPaths.length > 0) {
    await updatePaths(ctx, newPaths, endpoint.uuid, false, true)
  }
}

const fixEndpoints = async (ctx: MetloContext): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const endpoints: ApiEndpoint[] = await getQB(ctx, queryRunner)
      .select(["uuid", "path", `"userSet"`])
      .from(ApiEndpoint, "endpoint")
      .getRawMany()
    for (const endpoint of endpoints) {
      if (!endpoint.userSet) {
        await fixEndpoint(ctx, endpoint, queryRunner)
      }
    }
  } catch (err) {
    console.error(`Encountered error while fixing endpoints: ${err}`)
  } finally {
    await queryRunner.release()
  }
}

export default fixEndpoints
