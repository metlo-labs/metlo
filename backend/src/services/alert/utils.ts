import { Not, QueryRunner } from "typeorm"
import { AlertType, Status } from "@common/enums"
import { MetloContext } from "types"
import { getQB, getRepository } from "services/database/utils"
import { Alert } from "models"

export const existingUnresolvedAlert = async (
  ctx: MetloContext,
  apiEndpointUuid: string,
  type: AlertType,
  description: string,
  queryRunner?: QueryRunner,
) => {
  if (queryRunner) {
    return await getQB(ctx, queryRunner)
      .select(["uuid"])
      .from(Alert, "alert")
      .andWhere(`"apiEndpointUuid" = :id`, { id: apiEndpointUuid })
      .andWhere("type = :type", { type })
      .andWhere("status != :status", { status: Status.RESOLVED })
      .andWhere("description = :description", { description })
      .getRawOne()
  }
  const alertRepository = getRepository(ctx, Alert)
  return await alertRepository.findOne({
    select: {
      uuid: true,
    },
    where: {
      apiEndpointUuid,
      type,
      status: Not(Status.RESOLVED),
      description,
    },
  })
}
