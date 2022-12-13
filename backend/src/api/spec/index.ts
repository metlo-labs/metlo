import { Response } from "express"
import yaml from "js-yaml"
import { JSONValue } from "@common/types"
import { SpecService } from "services/spec"
import ApiResponseHandler from "api-response-handler"
import Error400BadRequest from "errors/error-400-bad-request"
import { OpenApiSpec } from "models"
import { SpecExtension } from "@common/enums"
import { EXTENSION_TO_MIME_TYPE } from "~/constants"
import { MetloRequest } from "types"
import { getRepository } from "services/database/utils"

export const getSpecHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { specFileName } = req.params
    const spec = await SpecService.getSpec(req.ctx, specFileName)
    await ApiResponseHandler.success(res, spec)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getSpecListHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const specList = await SpecService.getSpecs(req.ctx)
    await ApiResponseHandler.success(res, specList)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const uploadNewSpecHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.file) {
      throw new Error400BadRequest("No spec file found.")
    }
    const specFile = req.file
    const fileName = specFile.originalname
      ?.split(".json")[0]
      ?.split(".yaml")[0]
      ?.split(".yml")[0]
    let extension = undefined
    if (
      EXTENSION_TO_MIME_TYPE[SpecExtension.JSON].includes(specFile.mimetype)
    ) {
      extension = SpecExtension.JSON
    } else if (
      EXTENSION_TO_MIME_TYPE[SpecExtension.YAML].includes(specFile.mimetype)
    ) {
      extension = SpecExtension.YAML
    } else {
      throw new Error400BadRequest(
        "Only .json, .yaml, and .yml format allowed.",
      )
    }
    if (!fileName) {
      throw new Error400BadRequest("No filename provided.")
    }
    const openApiSpecRepository = getRepository(req.ctx, OpenApiSpec)
    const exisitingSpec = await openApiSpecRepository.findOneBy({
      name: fileName,
    })
    if (exisitingSpec) {
      throw new Error400BadRequest("Spec file already exists.")
    }
    const specObject: JSONValue = yaml.load(
      specFile.buffer.toString(),
    ) as JSONValue
    await SpecService.uploadNewSpec(
      req.ctx,
      specObject,
      fileName,
      extension,
      specFile.buffer.toString(),
    )
    await ApiResponseHandler.success(res, null)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const deleteSpecHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { specFileName } = req.params
    await SpecService.deleteSpec(req.ctx, specFileName)
    await ApiResponseHandler.success(res, null)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const updateSpecHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const specFile = req.file
    const { specFileName } = req.params
    let extension = undefined
    if (
      EXTENSION_TO_MIME_TYPE[SpecExtension.JSON].includes(specFile.mimetype)
    ) {
      extension = SpecExtension.JSON
    } else if (
      EXTENSION_TO_MIME_TYPE[SpecExtension.YAML].includes(specFile.mimetype)
    ) {
      extension = SpecExtension.YAML
    } else {
      throw new Error400BadRequest(
        "Only .json, .yaml, and .yml format allowed.",
      )
    }
    if (!specFileName) {
      throw new Error400BadRequest("No filename provided.")
    }
    const openApiSpecRepository = getRepository(req.ctx, OpenApiSpec)
    const exisitingSpec = await openApiSpecRepository.findOneBy({
      name: specFileName,
    })
    if (!exisitingSpec) {
      throw new Error400BadRequest("Spec file does not exist, cannot update.")
    }
    const specObject: JSONValue = yaml.load(
      specFile.buffer.toString(),
    ) as JSONValue
    await SpecService.updateSpec(
      req.ctx,
      specObject,
      specFileName,
      extension,
      specFile.buffer.toString(),
    )
    await ApiResponseHandler.success(res, null)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
