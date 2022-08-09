import { MatchedDataClass } from "../../models";
import { AppDataSource } from "../../data-source";

export class DataClassService {
  static async updateIsRisk(
    isRisk: boolean,
    piiFieldId: string
  ): Promise<MatchedDataClass> {
    const matchedDataClassRepository =
      AppDataSource.getRepository(MatchedDataClass);
    const matchedDataClass = await matchedDataClassRepository.findOne({
      where: { uuid: piiFieldId },
    });
    matchedDataClass.isRisk = isRisk;
    return await matchedDataClassRepository.save(matchedDataClass);
  }
}
