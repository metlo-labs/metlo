import { NextFunction, Request, Response } from "express"
import { Error401UnauthorizedRequest } from "errors"
import ApiResponseHandler from "api-response-handler"
import { UserService } from "services/user"

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["x-api-key"]
  try {
    if (apiKey && typeof apiKey === "string") {
      const user = await UserService.findUserByApiKey(apiKey)
      if (!user) {
        throw new Error401UnauthorizedRequest(
          "Unauthorized access. Unknown API Key.",
        )
      }
      req.user = user
      return next()
    } else {
      throw new Error401UnauthorizedRequest(
        "Unauthorized access. Please add `X-API-Key` header.",
      )
    }
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
