import mlog from "logger"
import { QueryFailedError } from "typeorm"
import { DatabaseError } from "pg-protocol"

const delay = (fn: any, ms: number) =>
  new Promise(resolve => setTimeout(() => resolve(fn()), ms))

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min)

export const isQueryFailedError = (
  err: unknown,
): err is QueryFailedError & DatabaseError => err instanceof QueryFailedError

export const retryTypeormTransaction = async (
  fn: any,
  maxAttempts: number,
  retryAll?: boolean,
) => {
  const execute = async (attempt: number) => {
    try {
      return await fn()
    } catch (err) {
      if (isQueryFailedError(err)) {
        if (err.code === "40P01" || err.code === "55P03" || retryAll) {
          if (attempt <= maxAttempts) {
            const nextAttempt = attempt + 1
            const delayInMilliseconds = randInt(200, 500)
            mlog.error(
              `Retrying after ${delayInMilliseconds} ms due to:`,
              err,
            )
            return delay(() => execute(nextAttempt), delayInMilliseconds)
          } else {
            throw err
          }
        } else {
          throw err
        }
      } else {
        throw err
      }
    }
  }
  return execute(1)
}
