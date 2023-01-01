import { Response, Router } from "express"
import ApiResponseHandler from "api-response-handler"
import {
  createNewWebhook,
  deleteWebhook,
  getWebhooks,
  updateWebhook,
} from "services/webhook"
import { MetloRequest } from "types"
import { CreateWebhookParamsSchema } from "@common/api/webhook"
import Error400BadRequest from "errors/error-400-bad-request"

export const getWebhooksHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const webhooks = await getWebhooks(req.ctx)
    await ApiResponseHandler.success(res, webhooks)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const createWebhookHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const parsedBody = CreateWebhookParamsSchema.safeParse(req.body)
  if (parsedBody.success == false) {
    await ApiResponseHandler.error(
      res,
      new Error400BadRequest(parsedBody.error.message),
    )
    return
  }
  try {
    const webhooks = await createNewWebhook(req.ctx, parsedBody.data)
    await ApiResponseHandler.success(res, webhooks)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const updateWebhookHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const parsedBody = CreateWebhookParamsSchema.safeParse(req.body)
  if (parsedBody.success == false) {
    await ApiResponseHandler.error(
      res,
      new Error400BadRequest(parsedBody.error.message),
    )
    return
  }
  try {
    const { webhookId } = req.params
    const webhooks = await updateWebhook(req.ctx, webhookId, parsedBody.data)
    await ApiResponseHandler.success(res, webhooks)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const deleteWebhookHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { webhookId } = req.params
    const webhooks = await deleteWebhook(req.ctx, webhookId)
    await ApiResponseHandler.success(res, webhooks)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export default function registerWebhookRoutes(router: Router) {
  router.get("/api/v1/webhooks", getWebhooksHandler)
  router.post("/api/v1/webhook", createWebhookHandler)
  router.delete("/api/v1/webhook/:webhookId", deleteWebhookHandler)
  router.put("/api/v1/webhook/:webhookId", updateWebhookHandler)
}
