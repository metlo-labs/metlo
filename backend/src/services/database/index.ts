import mlog from "logger"
import { AppDataSource } from "data-source"
import { DatabaseModel } from "models"
import Error500InternalServer from "errors/error-500-internal-server"
import { retryTypeormTransaction } from "utils/db"
import { getEntityManager } from "./utils"
import { MetloContext } from "types"

export class DatabaseService {
  static validateQuery(query: string) {}

  static async executeRawQuery(
    rawQuery: string,
    parameters?: any[],
  ): Promise<any> {
    this.validateQuery(rawQuery)

    const queryRunner = AppDataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    let res = null
    try {
      res = await queryRunner.query(rawQuery, parameters ?? [])
      await queryRunner.commitTransaction()
    } catch (err) {
      mlog.withErr(err).error("Encountered error while executing raw sql query")
      await queryRunner.rollbackTransaction()
      throw new Error500InternalServer(err)
    } finally {
      await queryRunner.release()
    }
    return res
  }

  static async executeRawQueries(
    rawQueries: string[],
    parameters?: [],
  ): Promise<any> {
    rawQueries.forEach(e => this.validateQuery(e))

    const queryRunner = AppDataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    let res = []
    try {
      for (let i = 0; i < rawQueries?.length; i++) {
        const query = rawQueries[i]
        res.push(await queryRunner.query(query, parameters?.[i] ?? []))
      }
      await queryRunner.commitTransaction()
    } catch (err) {
      mlog.withErr(err).error("Encountered error while executing raw sql query")
      await queryRunner.rollbackTransaction()
      throw new Error500InternalServer(err)
    } finally {
      await queryRunner.release()
    }
    return res
  }

  static async executeTransactions(
    ctx: MetloContext,
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
        const fn = () =>
          getEntityManager(ctx, queryRunner).saveList(item, {
            chunk: chunkBatch,
          })
        if (retry) {
          await retryTypeormTransaction(fn, 5)
        } else {
          await fn()
        }
      }
      for (let i = 0; i < removeItems.length; i++) {
        const item = removeItems[i]
        const fn = () =>
          getEntityManager(ctx, queryRunner).remove(item, { chunk: chunkBatch })
        if (retry) {
          await retryTypeormTransaction(fn, 5)
        } else {
          await fn()
        }
      }
      await queryRunner.commitTransaction()
    } catch (err) {
      mlog.error(
        `Encountered error while saving transactions to database: ${err}`,
      )
      await queryRunner.rollbackTransaction()
      throw new Error500InternalServer(err)
    } finally {
      await queryRunner.release()
    }
  }
}
