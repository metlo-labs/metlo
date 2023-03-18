import ApiResponseHandler from "api-response-handler"
import { Response } from "express"
import { MetloRequest } from "types"
import { getCombinedDataClassesCached } from "services/data-classes"

export async function getDataClassInfo(req: MetloRequest, res: Response) {
  const dataClassInfo = (await getCombinedDataClassesCached(req.ctx)).map(cls => ({
    className: cls.className,
    severity: cls.severity,
    shortName: cls.shortName,
  }))
  return await ApiResponseHandler.success(res, dataClassInfo)
}
