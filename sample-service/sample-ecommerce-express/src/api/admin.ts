import { FastifyReply, FastifyRequest } from "fastify"
import ApiResponseHandler from "api-response-handler"
import { Error401UnauthorizedRequest } from "errors"

export const getAdminConfig = async (
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> => {
  try {
    await ApiResponseHandler.success(res, {
      max_products: 200,
      max_carts: 15000,
      foo: "bar",
    })
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const editAdminConfig = async (
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> => {
  try {
    if (req.user.role != "admin") {
      throw new Error401UnauthorizedRequest("No access")
    }
    await ApiResponseHandler.success(res, {
      ok: true,
    })
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
