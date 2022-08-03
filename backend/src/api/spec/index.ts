import { Request, Response } from "express";
import yaml from "js-yaml";
import { JSONValue } from "../../types";
import { SpecService } from "../../services/spec";
import ApiResponseHandler from "../../api-response-handler";
import Error400BadRequest from "../../errors/error-400-bad-request";

export const uploadNewSpecHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new Error400BadRequest("No spec file found.");
    }
    const specFile = req.file;
    const specObject: JSONValue = yaml.load(
      specFile.buffer.toString()
    ) as JSONValue;
    await SpecService.uploadNewSpec(specObject);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};
