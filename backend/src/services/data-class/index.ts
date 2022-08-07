import { MatchedDataClass } from "../../../models";
import { AppDataSource } from "../../data-source";

export class DataClassService {
  static async updateIsRisk(isRisk: boolean, dataClassId: string) {
    const matchedDataClassRepository =
      AppDataSource.getRepository(MatchedDataClass);
    const matchedDataClass = await matchedDataClassRepository.findOne({
      where: { uuid: dataClassId },
    });
    matchedDataClass.isRisk = isRisk;
    return await matchedDataClassRepository.save(matchedDataClass);
  }
}
