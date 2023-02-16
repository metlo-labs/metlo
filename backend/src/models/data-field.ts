import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from "typeorm"
import { DataTag, DataType, DataSection } from "@common/enums"
import { ApiEndpoint } from "models/api-endpoint"
import MetloBaseEntity from "./metlo-base-entity"

@Entity()
@Unique("unique_constraint_data_field", [
  "dataSection",
  "dataPath",
  "apiEndpointUuid",
])
export class DataField extends MetloBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({
    type: "text",
    array: true,
    default: [],
  })
  dataClasses: string[]

  @Column({
    type: "text",
    array: true,
    default: [],
  })
  falsePositives: string[]

  @Column({
    type: "text",
    array: true,
    default: [],
  })
  scannerIdentified: string[]

  @Column({
    type: "enum",
    enum: DataType,
    nullable: false,
    enumName: "data_type_enum",
  })
  dataType: DataType

  @Column({
    type: "enum",
    enum: DataTag,
    nullable: true,
    enumName: "data_tag_enum",
  })
  dataTag: DataTag

  @Column({
    type: "enum",
    enum: DataSection,
    nullable: false,
    enumName: "data_section_enum",
  })
  dataSection: DataSection

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date

  @Column({ nullable: false, default: "" })
  dataPath: string

  @Column({ nullable: true })
  statusCode: number

  @Column({ nullable: true })
  contentType: string

  /**
   * Used to indicate which fields in the object of the dataPath are of type array.
   * The key of the Record indicates the field path in the object (e.g., field1.field2)
   * and the value is a number which indicates how deeply nested the array is (must be at least 1).
   */
  @Column({ type: "jsonb", nullable: true })
  arrayFields: Record<string, number>

  @Column({ nullable: true })
  isNullable: boolean

  @Column({ type: "jsonb", nullable: false, default: {} })
  traceHash: Record<string, number>

  @Column({ type: "jsonb", nullable: false, default: {} })
  matches: Record<string, string[]>

  @Column({ nullable: true })
  entity: string

  @Column({ nullable: false })
  @Index("apiEndpointUuid_data_field")
  apiEndpointUuid: string

  @ManyToOne(() => ApiEndpoint, apiEndpoint => apiEndpoint.dataFields)
  apiEndpoint: ApiEndpoint
}
