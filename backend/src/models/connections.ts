import {
  Entity,
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { ConnectionType } from "@common/enums";
import { AWS_CONNECTION, ENCRYPTED_AWS_CONNECTION__META } from "@common/types";
import { encrypt, generate_iv } from "~/utils/encryption";

@Entity()
export class Connections extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string;

  @Column({ type: "enum", enum: ConnectionType })
  connectionType: ConnectionType;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true, type: "jsonb" })
  aws?: AWS_CONNECTION;

  @Column({ nullable: true, type: "jsonb" })
  aws_meta?: ENCRYPTED_AWS_CONNECTION__META;

  @BeforeInsert()
  beforeInsert() {
    let key = process.env.ENCRYPTION_KEY;
    let encryptionKey = Buffer.from(key, "base64");
    if (this.connectionType == ConnectionType.AWS && this.aws) {
      // Encrypt Keypairs, i.e. ssh keys
      let keypair_iv = generate_iv();
      let { encrypted: encrypted_k, tag: tag_k } = encrypt(
        this.aws.keypair,
        Buffer.from(encryptionKey),
        keypair_iv
      );
      this.aws.keypair = encrypted_k;

      // Encrypt AWS secret access key
      let sa_key_iv = generate_iv();
      let { encrypted: encrypted_sa, tag: tag_sa } = encrypt(
        this.aws.secret_access_key,
        Buffer.from(encryptionKey),
        sa_key_iv
      );
      this.aws.secret_access_key = encrypted_sa;

      // Encrypt AWS access id
      let access_id_iv = generate_iv();
      let { encrypted: encrypted_access_id, tag: tag_access_id } = encrypt(
        this.aws.secret_access_key,
        Buffer.from(encryptionKey),
        access_id_iv
      );
      this.aws.access_id = encrypted_access_id;
      if (!this.aws_meta) {
        this.aws_meta = {
          keypair_tag: tag_k.toString(),
          keypair_iv: keypair_iv.toString(),
          access_id_iv: access_id_iv.toString(),
          access_id_tag: tag_access_id.toString(),
          secret_access_key_tag: tag_sa.toString(),
          secret_access_key_iv: sa_key_iv.toString(),
        };
      }
    }
  }
}
