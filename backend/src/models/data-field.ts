import {
  Entity,
  BaseEntity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { DataClass, DataTag, DataType, DataSection } from "@common/enums";
import { ApiEndpoint } from "models/api-endpoint";

@Entity()
export class DataField extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string;

  @Column({ type: "enum", enum: DataClass, nullable: true })
  dataClass: DataClass;

  @Column({ type: "enum", enum: DataType, nullable: false })
  dataType: DataType;

  @Column({ type: "enum", enum: DataTag, nullable: true })
  dataTag: DataTag;

  @Column({ type: "enum", enum: DataSection, nullable: false })
  dataSection: DataSection;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @Column({ nullable: false })
  dataPath: string;

  @Column({ type: "varchar", array: true, nullable: false, default: [] })
  matches: string[];

  @Column({ type: "bool", default: false })
  isRisk: boolean;

  @Column({ nullable: false })
  apiEndpointUuid: string;

  @ManyToOne(() => ApiEndpoint, (apiEndpoint) => apiEndpoint.dataFields)
  apiEndpoint: ApiEndpoint;

  updateMatches(matches: string[]): boolean {
    let updated = false;
    if (this.matches === null || this.matches === undefined) {
      this.matches = Array<string>();
    }
    for (const match of matches) {
      if (this.matches.length >= 10) {
        break;
      }
      if (!this.matches.includes(match)) {
        this.matches.push(match);
        updated = true;
      }
    }
    return updated;
  }
}
