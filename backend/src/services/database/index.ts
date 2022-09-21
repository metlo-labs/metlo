import { QueryFailedError } from "typeorm"
import { DatabaseError } from "pg-protocol"
import { AppDataSource } from "data-source"
import { DatabaseModel } from "models"
import Error500InternalServer from "errors/error-500-internal-server"
import { getDataType } from "utils"
import { DataType } from "@common/enums"

export class DatabaseService {
  static isQueryFailedError = (
    err: unknown,
  ): err is QueryFailedError & DatabaseError => err instanceof QueryFailedError

  static delay = (fn: any, ms: number) =>
    new Promise(resolve => setTimeout(() => resolve(fn()), ms))

  static randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1) + min)

  static async retryTypeormTransaction(fn: any, maxAttempts: number) {
    const execute = async (attempt: number) => {
      try {
        return await fn()
      } catch (err) {
        if (this.isQueryFailedError(err)) {
          if (err.code === "40P01" || err.code === "55P03") {
            if (attempt <= maxAttempts) {
              const nextAttempt = attempt + 1
              const delayInMilliseconds = this.randInt(200, 1000)
              console.error(
                `Retrying after ${delayInMilliseconds} ms due to:`,
                err,
              )
              return this.delay(() => execute(nextAttempt), delayInMilliseconds)
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

  static async executeRawQueries(
    rawQueries: string | string[],
    parameters?: any[][],
  ): Promise<any> {
    const queryRunner = AppDataSource.createQueryRunner()
    await queryRunner.connect()
    const isMultiple = getDataType(rawQueries) === DataType.ARRAY
    let res = null
    if (isMultiple) {
      res = []
    }
    try {
      if (isMultiple) {
        for (let i = 0; i < rawQueries?.length; i++) {
          const query = rawQueries[i]
          res.push(await queryRunner.query(query, parameters?.[i] ?? []))
        }
      } else {
        res = await queryRunner.query(rawQueries as string, parameters ?? [])
      }
    } catch (err) {
      console.error(`Encountered error while executing raw sql query: ${err}`)
      await queryRunner.rollbackTransaction()
      throw new Error500InternalServer(err)
    } finally {
      await queryRunner.release()
    }
    return res
  }

  static async executeTransactions(
    saveItems: DatabaseModel[][],
    removeItems: DatabaseModel[][],
    retry?: boolean,
  ) {
    const queryRunner = AppDataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const chunkBatch = 1000
      for (let i = 0; i < saveItems.length; i++) {
        const item = saveItems[i]
        const chunkSize =
          item.length > chunkBatch ? item.length / chunkBatch : chunkBatch
        const fn = () => queryRunner.manager.save(item, { chunk: chunkBatch })
        if (retry) {
          await this.retryTypeormTransaction(fn, 5)
        } else {
          await fn()
        }
      }
      for (let i = 0; i < removeItems.length; i++) {
        const item = removeItems[i]
        const chunkSize =
          item.length > chunkBatch ? item.length / chunkBatch : chunkBatch
        const fn = () => queryRunner.manager.remove(item, { chunk: chunkBatch })
        if (retry) {
          await this.retryTypeormTransaction(fn, 5)
        } else {
          await fn()
        }
      }
      await queryRunner.commitTransaction()
    } catch (err) {
      console.error(
        `Encountered error while saving transactions to database: ${err}`,
      )
      await queryRunner.rollbackTransaction()
      throw new Error500InternalServer(err)
    } finally {
      await queryRunner.release()
    }
  }
}
