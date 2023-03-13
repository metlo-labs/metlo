import { FastifyReply, FastifyRequest } from "fastify"
import ApiResponseHandler from "api-response-handler"
import { AddNewProductParams } from "types"
import { ProductService } from "services/product"
import { Error404NotFound } from "errors"

export const createNewProductHandler = async (
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> => {
  try {
    const addNewProductParams: AddNewProductParams =
      req.body as AddNewProductParams
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
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> => {
  try {
    const { productUuid } = req.params as { productUuid: string }
    const product = await ProductService.getProduct(productUuid, req.user)
    if (!product) {
      throw new Error404NotFound("No product found for uuid.")
    }
    await ApiResponseHandler.success(res, product)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const editProductHandler = async (
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> => {
  try {
    const { productUuid } = req.params as { productUuid: string }
    const editNewProductParams: AddNewProductParams =
      req.body as AddNewProductParams
    await ProductService.editProduct(
      productUuid,
      editNewProductParams,
      req.user,
    )
    await ApiResponseHandler.success(res, "OK")
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getProductsHandler = async (
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> => {
  try {
    await ApiResponseHandler.success(res, await ProductService.getProducts())
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
