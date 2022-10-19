import { Request, Response } from "express"
import ApiResponseHandler from "api-response-handler"
import { CartService } from "services/cart"
import { Error404NotFound } from "errors"
import { PurchaseCartParams } from "types"

export const createNewCartHandler = async (
  req: Request,
  res: Response,
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
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { cartUuid } = req.params
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
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await ApiResponseHandler.success(res, await CartService.getCarts())
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const addProductHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { cartUuid } = req.params
    const { productUuid } = req.body
    await CartService.addProduct(cartUuid, productUuid)
    await ApiResponseHandler.success(res, null)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const purchaseCartHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { cartUuid } = req.params
    const purchaseCartParams: PurchaseCartParams = req.body
    const payload = await CartService.purchaseCart(cartUuid, purchaseCartParams)
    await ApiResponseHandler.success(res, payload)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
