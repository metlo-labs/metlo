import { Request, Response } from "express";
import yaml from "js-yaml";
import { JSONValue } from "../../types";
import { SpecService } from "../../services/spec";
import ApiResponseHandler from "../../api-response-handler";
import Error400BadRequest from "../../errors/error-400-bad-request";
import { AppDataSource } from "../../data-source";
import { OpenApiSpec } from "../../models";
import { SpecExtension } from "../../enums";

export const getSpecHandler = async (req: Request, res: Response) => {
  try {
    const { specFileName } = req.params;
    const spec = await SpecService.getSpec(specFileName);
    await ApiResponseHandler.success(res, spec);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};

export const getSpecListHandler = async (req: Request, res: Response) => {
  try {
    const specList = await SpecService.getSpecs();
    await ApiResponseHandler.success(res, specList);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};

export const uploadNewSpecHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new Error400BadRequest("No spec file found.");
    }
    const specFile = req.file;
    const fileName = specFile.originalname
      ?.split(".json")[0]
      ?.split(".yaml")[0]
      ?.split(".yml")[0];
    let extension = undefined;
    if (specFile.mimetype === "application/json") {
      extension = SpecExtension.JSON;
    } else if (specFile.mimetype === "text/yaml") {
      extension = SpecExtension.YAML;
    } else {
      throw new Error400BadRequest(
        "Only .json, .yaml, and .yml format allowed."
      );
    }
    if (!fileName) {
      throw new Error400BadRequest("No filename provided.");
    }
    const openApiSpecRepository = AppDataSource.getRepository(OpenApiSpec);
    const exisitingSpec = await openApiSpecRepository.findOneBy({
      name: fileName,
    });
    if (exisitingSpec) {
      throw new Error400BadRequest("Spec file already exists.");
    }
    const specObject: JSONValue = yaml.load(
      specFile.buffer.toString()
    ) as JSONValue;
    await SpecService.uploadNewSpec(
      specObject,
      fileName,
      extension,
      specFile.buffer.toString()
    );
    await ApiResponseHandler.success(res, null);
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
};

export const updateSpecHandler = async (req: Request, res: Response) => {
  try {
    const specFile = req.file;
    const { specFileName } = req.params;
    let extension = undefined;
    if (specFile.mimetype === "application/json") {
      extension = SpecExtension.JSON;
    } else if (specFile.mimetype === "text/yaml") {
      extension = SpecExtension.YAML;
    } else {
      throw new Error400BadRequest(
        "Only .json, .yaml, and .yml format allowed."
      );
    }
    if (!specFileName) {
      throw new Error400BadRequest("No filename provided.");
    }
    const openApiSpecRepository = AppDataSource.getRepository(OpenApiSpec);
    const exisitingSpec = await openApiSpecRepository.findOneBy({
      name: specFileName,
    });
    if (!exisitingSpec) {
      throw new Error400BadRequest("Spec file does not exist, cannot update.");
    }
    const specObject: JSONValue = yaml.load(
      specFile.buffer.toString()
    ) as JSONValue;
    await SpecService.updateSpec(
      specObject,
      specFileName,
      extension,
      specFile.buffer.toString()
    );
    await ApiResponseHandler.success(res, null);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};
