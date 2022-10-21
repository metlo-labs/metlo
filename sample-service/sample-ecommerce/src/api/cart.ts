import { FastifyReply, FastifyRequest } from "fastify"
import ApiResponseHandler from "api-response-handler"
import { CartService } from "services/cart"
import { Error404NotFound } from "errors"
import { PurchaseCartParams } from "types"

export const createNewCartHandler = async (
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> => {
  try {
    const cartUuid = await CartService.createNewCart()
    const payload = { cartId: cartUuid }
    await ApiResponseHandler.success(res, payload)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getCartHandler = async (
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> => {
  try {
    const { cartUuid } = req.params as { cartUuid: string }
    const cart = await CartService.getCart(cartUuid)
    if (!cart) {
      throw new Error404NotFound("Cart not found.")
    }
    await ApiResponseHandler.success(res, cart)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getCartsHandler = async (
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> => {
  try {
    await ApiResponseHandler.success(res, await CartService.getCarts())
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const addProductHandler = async (
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> => {
  try {
    const { cartUuid } = req.params as { cartUuid: string }
    const { productUuid } = req.body as { productUuid: string }
    await CartService.addProduct(cartUuid, productUuid)
    await ApiResponseHandler.success(res, null)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const purchaseCartHandler = async (
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> => {
  try {
    const { cartUuid } = req.params as { cartUuid: string }
    const purchaseCartParams: PurchaseCartParams =
      req.body as PurchaseCartParams
    const payload = await CartService.purchaseCart(cartUuid, purchaseCartParams)
    await ApiResponseHandler.success(res, payload)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
