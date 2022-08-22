import { DataField } from "models";
import { AppDataSource } from "data-source";
import Error500InternalServer from "errors/error-500-internal-server";

export class DataFieldService {
  static async updateIsRisk(
    isRisk: boolean,
    fieldId: string
  ): Promise<DataField> {
    const dataFieldRepository = AppDataSource.getRepository(DataField);
    const dataField = await dataFieldRepository.findOne({
      where: { uuid: fieldId },
    });
    if (!dataField.dataClass) {
      throw new Error500InternalServer(
        "Cannot update because data field is not identified as sensitive data."
      );
    }
    dataField.isRisk = isRisk;
    return await dataFieldRepository.save(dataField);
  }
}
