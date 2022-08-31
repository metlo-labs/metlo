import {
  Entity,
  BaseEntity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm"
import { DataClass, DataTag, DataType, DataSection } from "@common/enums"
import { ApiEndpoint } from "models/api-endpoint"

@Entity()
export class DataField extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ type: "enum", enum: DataClass, array: true, default: [] })
  dataClasses: DataClass[]

  @Column({ type: "enum", enum: DataClass, array: true, default: [] })
  falsePositives: DataClass[]

  @Column({ type: "enum", enum: DataClass, array: true, default: [] })
  scannerIdentified: DataClass[]

  @Column({ type: "enum", enum: DataType, nullable: false })
  dataType: DataType

  @Column({ type: "enum", enum: DataTag, nullable: true })
  dataTag: DataTag

  @Column({ type: "enum", enum: DataSection, nullable: false })
  dataSection: DataSection

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date

  @Column({ nullable: false })
  dataPath: string

  @Column({ type: "jsonb", nullable: false, default: {} })
  matches: Record<DataClass, string[]>

  @Column({ nullable: false })
  apiEndpointUuid: string

  @ManyToOne(() => ApiEndpoint, apiEndpoint => apiEndpoint.dataFields)
  apiEndpoint: ApiEndpoint

  addDataClass(dataClass: DataClass): boolean {
    if (this.dataClasses === null || this.dataClasses === undefined) {
      this.dataClasses = Array<DataClass>()
    }
    if (this.falsePositives === null || this.falsePositives === undefined) {
      this.falsePositives = Array<DataClass>()
    }
    if (
      this.scannerIdentified === null ||
      this.scannerIdentified === undefined
    ) {
      this.scannerIdentified = Array<DataClass>()
    }
    if (
      dataClass === null ||
      this.dataClasses.includes(dataClass) ||
      this.falsePositives.includes(dataClass)
    ) {
      return false
    }
    this.dataClasses.push(dataClass)
    this.scannerIdentified.push(dataClass)
    return true
  }

  updateMatches(dataClass: DataClass, matches: string[]): boolean {
    if (this.dataClasses === null || this.dataClasses === undefined) {
      this.dataClasses = Array<DataClass>()
    }
    if (
      !matches ||
      matches?.length === 0 ||
      dataClass === null ||
      !this.dataClasses.includes(dataClass)
    ) {
      return false
    }

    let updated = false
    if (this.matches === null || this.matches === undefined) {
      this.matches = {} as Record<DataClass, string[]>
    }
    if (
      this.matches[dataClass] == null ||
      this.matches[dataClass] === undefined
    ) {
      this.matches[dataClass] = []
    }

    for (const match of matches) {
      if (this.matches[dataClass].length >= 10) {
        break
      }
      if (!this.matches[dataClass].includes(match)) {
        this.matches[dataClass].push(match)
        updated = true
      }
    }
    return updated
  }
}
