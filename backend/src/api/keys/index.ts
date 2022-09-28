import ApiResponseHandler from "api-response-handler"
import { Request, Response } from "express"
import { AppDataSource } from "data-source"
import { ApiKey } from "models"
import Error404NotFound from "errors/error-404-not-found"
import crypto from "crypto"
import { hasher } from "utils/hash"
import { createApiKey } from "./service"
import Error400BadRequest from "errors/error-400-bad-request"

export const listKeys = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const keys = await AppDataSource.getRepository(ApiKey).find()
    return ApiResponseHandler.success(res, keys.map((v) => "metlo." + v.keyIdentifier))
}

export const createKey = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { name: keyName } = req.body
    const key_exists = await AppDataSource.getRepository(ApiKey).countBy({ name: keyName })
    if (key_exists) {
        return ApiResponseHandler.error(res, new Error400BadRequest(`Can not create key with name ${keyName}`))
    }
    const [key, rawKey] = createApiKey(keyName)
    await AppDataSource.getRepository(ApiKey).save(
        key,
    )
    return ApiResponseHandler.success(res, {
        apiKey: rawKey
    })
}

export const deleteKey = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { name: keyName } = req.params

    let del_resp = await AppDataSource
        .createQueryBuilder()
        .delete()
        .from(ApiKey)
        .where("name = :name", { name: keyName })
        .execute()

    if (del_resp.affected != 0) {
        return ApiResponseHandler.success(res, {
            "status": "OK"
        })
    } else {
        return ApiResponseHandler.error(res, new Error404NotFound(`Did not find any matching keys for ${keyName}`))
    }


}