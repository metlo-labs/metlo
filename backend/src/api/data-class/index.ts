import ApiResponseHandler from "api-response-handler";
import { Response } from "express";
import { MetloRequest } from "types";
import { getCombinedDataClasses } from "services/data-classes";

export async function getDataClassInfo(req: MetloRequest, res: Response) {
    const dataClassInfo = (await getCombinedDataClasses(req.ctx)).map(cls => ({ className: cls.className, severity: cls.severity }))
    return await ApiResponseHandler.success(res, dataClassInfo)
}