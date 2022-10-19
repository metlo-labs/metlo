import { Request, Response } from "express"
import ApiResponseHandler from "api-response-handler"
import { AddNewProductParams } from "types"
import { ProductService } from "services/product"
import { Error404NotFound } from "errors"

export const createNewProductHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const addNewProductParams: AddNewProductParams = req.body
    const newProductId = await ProductService.addNewProduct(
      addNewProductParams,
      req.user,
    )
    await ApiResponseHandler.success(res, { productId: newProductId })
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getProductHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { productUuid } = req.params
    const product = await ProductService.getProduct(productUuid)
    if (!product) {
      throw new Error404NotFound("No product found for uuid.")
    }
    await ApiResponseHandler.success(res, product)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getProductsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await ApiResponseHandler.success(res, await ProductService.getProducts())
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
