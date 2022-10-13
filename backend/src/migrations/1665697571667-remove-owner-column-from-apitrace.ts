import { MigrationInterface, QueryRunner, TableColumn } from "typeorm"

export class removeOwnerColumnFromApitrace1665697571667
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("api_trace", "owner")
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "api_trace",
      new TableColumn({
        name: "owner",
        type: "varchar",
        isNullable: true,
        default: null,
      }),
    )
  }
}
