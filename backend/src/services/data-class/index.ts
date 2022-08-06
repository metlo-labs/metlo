import { MatchedDataClass } from "../../../models";
import { AppDataSource } from "../../data-source";

export class DataClassService {
  static async updateIsRisk(isRisk: boolean, dataClassId: string) {
    const matchedDataClassRepository =
      AppDataSource.getRepository(MatchedDataClass);
    const matchedDataClass = await matchedDataClassRepository.findOneBy({
      uuid: dataClassId,
    });
    matchedDataClass.isRisk = isRisk;
    await matchedDataClassRepository.save(matchedDataClass);
  }
}
