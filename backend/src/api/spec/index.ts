import { Request, Response } from "express";
import yaml from "js-yaml";
import { JSONValue } from "../../types";
import { SpecService } from "../../services/spec";
import ApiResponseHandler from "../../api-response-handler";
import Error400BadRequest from "../../errors/error-400-bad-request";
import { AppDataSource } from "../../data-source";
import { OpenApiSpec } from "../../../models";

export const uploadNewSpecHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new Error400BadRequest("No spec file found.");
    }
    const specFile = req.file;
    const fileName = req.file.filename || req.file.fieldname;
    if (!fileName) {
      throw new Error400BadRequest("No filename provided.")
    }
    const openApiSpecRepository = AppDataSource.getRepository(OpenApiSpec);
    const exisitingSpec = await openApiSpecRepository.findOneBy({ name: fileName });
    if (exisitingSpec) {
      throw new Error400BadRequest("Spec file already exists.");
    }
    const specObject: JSONValue = yaml.load(
      specFile.buffer.toString()
    ) as JSONValue;
    await SpecService.uploadNewSpec(specObject, fileName);
    await ApiResponseHandler.success(res, null)
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};

export const deleteSpecHandler = async (req: Request, res: Response) => {
  try {
    const { specFileName } = req.params;
    await SpecService.deleteSpec(specFileName);
    await ApiResponseHandler.success(res, null);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
}
