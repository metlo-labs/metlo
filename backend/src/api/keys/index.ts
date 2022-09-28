import ApiResponseHandler from "api-response-handler"
import { Request, Response } from "express"
import { AppDataSource } from "data-source"
import { ApiKey } from "models"

export const listKeys = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const keys = await AppDataSource.getRepository(ApiKey).find()
    return ApiResponseHandler.success(res, keys.map((v) => "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx" + v.apiKey.slice(-4)))
}

export const createKey = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { name: keyName } = req.body
    const newKey = ApiKey.create({ name: keyName })
    const key = await AppDataSource.getRepository(ApiKey).save(
        newKey,
    )
    return ApiResponseHandler.success(res, {
        apiKey: key.apiKey
    })
}