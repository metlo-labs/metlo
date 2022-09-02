import { DataClass } from "@common/enums"
import { AppDataSource } from "data-source"
import cache from "memory-cache"

export const getPIIDataTypeCount = async () => {
  const queryRunner = AppDataSource.createQueryRunner()
  const piiDataTypeCountRes: { type: DataClass; cnt: number }[] =
    await queryRunner.manager.query(`
    SELECT data_class as type, CAST(COUNT(*) AS INTEGER) as cnt
    FROM (SELECT UNNEST("dataClasses") as data_class FROM data_field) tbl
    GROUP BY 1
  `)
  return Object.fromEntries(piiDataTypeCountRes.map(e => [e.type, e.cnt]))
}

export const getPIIDataTypeCountCached = async () => {
  const cacheRes: Record<DataClass, number> | null = cache.get("PIIDataTypeCount")
  if (cacheRes) {
    return cacheRes
  }
  const realRes = await getPIIDataTypeCount()
  cache.put("PIIDataTypeCount", realRes, 5000)
  return realRes
}