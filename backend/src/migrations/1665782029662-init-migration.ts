import { MigrationInterface, QueryRunner } from "typeorm"
import { getExistingConstraint } from "utils"

export class initMigration1665782029662 implements MigrationInterface {
  name = "initMigration1665782029662"

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existingDataClassEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'data_class_enum'",
    )
    if (!existingDataClassEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."data_class_enum" AS ENUM('Email', 'Credit Card Number', 'Social Security Number', 'Phone Number', 'IP Address', 'Geographic Coordinates', 'Vehicle Identification Number', 'Address', 'Date of Birth', 'Driver License Number')`,
      )
    }
    const existingDataTypeEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'data_type_enum'",
    )
    if (!existingDataTypeEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."data_type_enum" AS ENUM('integer', 'number', 'string', 'boolean', 'object', 'array', 'unknown')`,
      )
    }
    const existingDataTagEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'data_tag_enum'",
    )
    if (!existingDataTagEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."data_tag_enum" AS ENUM('PII')`,
      )
    }
    const existingDataSectionEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'data_section_enum'",
    )
    if (!existingDataSectionEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."data_section_enum" AS ENUM('reqPath', 'reqQuery', 'reqHeaders', 'reqBody', 'resHeaders', 'resBody')`,
      )
    }
    const existingAlertTypeEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'alert_type_enum'",
    )
    if (!existingAlertTypeEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."alert_type_enum" AS ENUM('New Endpoint Detected', 'PII Data Detected', 'Open API Spec Diff', 'Sensitive Data in Query Params', 'Sensitive Data in Path Params', 'Basic Authentication Detected', 'Endpoint not secured by SSL', 'Unauthenticated Endpoint returning Sensitive Data')`,
      )
    }
    const existingAlertStatusEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'alert_status_enum'",
    )
    if (!existingAlertStatusEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."alert_status_enum" AS ENUM('Resolved', 'Ignored', 'Open')`,
      )
    }
    const existingRiskScoreEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'riskscore_enum'",
    )
    if (!existingRiskScoreEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."riskscore_enum" AS ENUM('none', 'low', 'medium', 'high')`,
      )
    }
    const existingSpecExtensionEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'spec_extension_enum'",
    )
    if (!existingSpecExtensionEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."spec_extension_enum" AS ENUM('json', 'yaml')`,
      )
    }
    const existingRestMethodEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'rest_method_enum'",
    )
    if (!existingRestMethodEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."rest_method_enum" AS ENUM('GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE')`,
      )
    }
    const existingConnectionTypeEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'connection_type_enum'",
    )
    if (!existingConnectionTypeEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."connection_type_enum" AS ENUM('AWS', 'GCP')`,
      )
    }
    const existingApiKeyTypeEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'api_key_type_enum'",
    )
    if (!existingApiKeyTypeEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."api_key_type_enum" AS ENUM('GCP', 'AWS', 'GENERIC')`,
      )
    }
    const existingDisableRestMethodEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'disable_rest_method_enum'",
    )
    if (!existingDisableRestMethodEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."disable_rest_method_enum" AS ENUM('GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'ALL')`,
      )
    }
    const existingAuthTypeEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'auth_type_enum'",
    )
    if (!existingAuthTypeEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."auth_type_enum" AS ENUM('basic', 'header', 'jwt', 'session_cookie')`,
      )
    }
    const existingAttackTypeEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'attack_type_enum'",
    )
    if (!existingAttackTypeEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."attack_type_enum" AS ENUM('High Usage on Sensitive Endpoint', 'High Error Rate', 'Anomalous Call Order', 'Unauthenticated Access', 'Broken Object Level Authorization')`,
      )
    }

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "data_field" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "dataClasses" "public"."data_class_enum" array NOT NULL DEFAULT '{}', "falsePositives" "public"."data_class_enum" array NOT NULL DEFAULT '{}', "scannerIdentified" "public"."data_class_enum" array NOT NULL DEFAULT '{}', "dataType" "public"."data_type_enum" NOT NULL, "dataTag" "public"."data_tag_enum", "dataSection" "public"."data_section_enum" NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "dataPath" character varying NOT NULL DEFAULT '', "matches" jsonb NOT NULL DEFAULT '{}', "apiEndpointUuid" uuid NOT NULL, CONSTRAINT "unique_constraint_data_field" UNIQUE ("dataSection", "dataPath", "apiEndpointUuid"), CONSTRAINT "PK_481f41d0c4ec18902afc56f1c3b" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "alert" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."alert_type_enum" NOT NULL, "riskScore" "public"."riskscore_enum" NOT NULL DEFAULT 'none', "apiEndpointUuid" uuid NOT NULL, "description" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "status" "public"."alert_status_enum" NOT NULL DEFAULT 'Open', "resolutionMessage" character varying, "context" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_fdad2115a9a19500e2d142fa93e" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "open_api_spec" ("name" character varying NOT NULL, "spec" character varying NOT NULL, "hosts" character varying array NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "specUpdatedAt" TIMESTAMP WITH TIME ZONE, "extension" "public"."spec_extension_enum" NOT NULL DEFAULT 'json', "isAutoGenerated" boolean NOT NULL DEFAULT false, "minimizedSpecContext" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_158a7437a61bb78008998c0684f" PRIMARY KEY ("name"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "api_endpoint" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "path" character varying NOT NULL, "pathRegex" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "firstDetected" TIMESTAMP WITH TIME ZONE, "lastActive" TIMESTAMP WITH TIME ZONE, "host" character varying NOT NULL, "numberParams" integer NOT NULL DEFAULT '0', "method" "public"."rest_method_enum" NOT NULL, "riskScore" "public"."riskscore_enum" NOT NULL DEFAULT 'none', "owner" character varying, "oldEndpointUuids" uuid array NOT NULL DEFAULT '{}', "isAuthenticatedDetected" boolean NOT NULL DEFAULT true, "isAuthenticatedUserSet" boolean, "openapiSpecName" character varying, CONSTRAINT "PK_71a47ffc0b93acbffd3f41d0938" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "api_trace" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "path" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "host" character varying NOT NULL, "method" "public"."rest_method_enum" NOT NULL, "requestParameters" jsonb DEFAULT '[]', "requestHeaders" jsonb DEFAULT '[]', "requestBody" character varying, "responseStatus" integer NOT NULL, "responseHeaders" jsonb DEFAULT '[]', "responseBody" character varying, "meta" jsonb, "sessionMeta" jsonb NOT NULL DEFAULT '{}', "analyzed" boolean NOT NULL DEFAULT false, "apiEndpointUuid" uuid, CONSTRAINT "PK_ef2d612e84eb2d1375f0c4e05fa" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e8f3eb3f1d074dc4ddcfdb9151" ON "api_trace" ("apiEndpointUuid") `,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "session" ("expiredAt" bigint NOT NULL, "id" character varying(255) NOT NULL, "json" text NOT NULL, "destroyedAt" TIMESTAMP, CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_28c5d1d16da7908c97c9bc2f74" ON "session" ("expiredAt") `,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "connections" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "connectionType" "public"."connection_type_enum" NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "aws" jsonb, "aws_meta" jsonb, "gcp" jsonb, "gcp_meta" jsonb, CONSTRAINT "PK_fd0e765308bb2b80af73ba85de6" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "api_endpoint_test" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "tags" jsonb, "requests" jsonb, "apiEndpointUuid" uuid, CONSTRAINT "PK_cf38233f75db163be52b28d6637" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "api_key" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "apiKeyHash" text NOT NULL, "keyIdentifier" text NOT NULL, "for" "public"."api_key_type_enum" NOT NULL DEFAULT 'GENERIC', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_73c82e6a8ac3a48701b2e77f91c" UNIQUE ("name"), CONSTRAINT "UQ_3c254ac4ce1a6d4a26da30c5575" UNIQUE ("apiKeyHash"), CONSTRAINT "PK_f07cf6dbb3ed3600a5511578f81" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "block_fields" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "path" character varying NOT NULL, "pathRegex" character varying NOT NULL, "method" "public"."disable_rest_method_enum" NOT NULL, "host" character varying NOT NULL, "numberParams" integer NOT NULL DEFAULT '0', "disabledPaths" character varying array NOT NULL DEFAULT '{}', CONSTRAINT "PK_af4435534e7494a34ce5330fba7" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "instance_settings" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "updateEmail" character varying, "skippedUpdateEmail" boolean, CONSTRAINT "PK_6d19e4e386fa48d467619d6747b" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "authentication_config" ("host" character varying NOT NULL, "authType" "public"."auth_type_enum" NOT NULL, "headerKey" character varying, "jwtUserPath" character varying, "cookieName" character varying, CONSTRAINT "PK_9b463ac4dad1b0cf46a6fad5575" PRIMARY KEY ("host"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "aggregate_trace_data_hourly" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "numCalls" integer NOT NULL, "hour" TIMESTAMP WITH TIME ZONE NOT NULL, "apiEndpointUuid" uuid NOT NULL, CONSTRAINT "unique_constraint_hourly" UNIQUE ("apiEndpointUuid", "hour"), CONSTRAINT "PK_fe52966fdb8a4d83e6b6bc8eb64" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "attack" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "riskScore" "public"."riskscore_enum" NOT NULL, "attackType" "public"."attack_type_enum" NOT NULL, "description" character varying NOT NULL, "metadata" jsonb NOT NULL DEFAULT '{}', "startTime" TIMESTAMP WITH TIME ZONE NOT NULL, "endTime" TIMESTAMP WITH TIME ZONE, "uniqueSessionKey" text, "host" character varying NOT NULL, "sourceIP" character varying, "apiEndpointUuid" uuid, "resolved" boolean NOT NULL DEFAULT false, "snoozed" boolean NOT NULL DEFAULT false, "snoozeHours" integer, CONSTRAINT "PK_93940c4073f0acc1a0dc083621d" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_7ad5122a8059eb424d16dbf674" ON "attack" ("apiEndpointUuid") `,
    )

    const existingApiEndpointFkDataField = await getExistingConstraint(
      queryRunner,
      "FK_81606413c90c1e2a80fd96ec5f6",
      "data_field",
    )
    if (!existingApiEndpointFkDataField[0]) {
      await queryRunner.query(
        `ALTER TABLE "data_field" ADD CONSTRAINT "FK_81606413c90c1e2a80fd96ec5f6" FOREIGN KEY ("apiEndpointUuid") REFERENCES "api_endpoint"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      )
    }
    const existingApiEndpointFkAlert = await getExistingConstraint(
      queryRunner,
      "FK_a7efd92cbc6de6ba3a202193cf1",
      "alert",
    )
    if (!existingApiEndpointFkAlert[0]) {
      await queryRunner.query(
        `ALTER TABLE "alert" ADD CONSTRAINT "FK_a7efd92cbc6de6ba3a202193cf1" FOREIGN KEY ("apiEndpointUuid") REFERENCES "api_endpoint"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      )
    }
    const existingOpenApiSpecNameFkApiEndpoint = await getExistingConstraint(
      queryRunner,
      "FK_8a9c958f18d171609007044d6ac",
      "api_endpoint",
    )
    if (!existingOpenApiSpecNameFkApiEndpoint[0]) {
      await queryRunner.query(
        `ALTER TABLE "api_endpoint" ADD CONSTRAINT "FK_8a9c958f18d171609007044d6ac" FOREIGN KEY ("openapiSpecName") REFERENCES "open_api_spec"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      )
    }
    const existingApiEndpointFkApiTrace = await getExistingConstraint(
      queryRunner,
      "FK_e8f3eb3f1d074dc4ddcfdb91516",
      "api_trace",
    )
    if (!existingApiEndpointFkApiTrace[0]) {
      await queryRunner.query(
        `ALTER TABLE "api_trace" ADD CONSTRAINT "FK_e8f3eb3f1d074dc4ddcfdb91516" FOREIGN KEY ("apiEndpointUuid") REFERENCES "api_endpoint"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      )
    }
    const existingApiEndpointFkApiEndpointTest = await getExistingConstraint(
      queryRunner,
      "FK_86fe6fb7fdb3b96284fd1df814a",
      "api_endpoint_test",
    )
    if (!existingApiEndpointFkApiEndpointTest[0]) {
      await queryRunner.query(
        `ALTER TABLE "api_endpoint_test" ADD CONSTRAINT "FK_86fe6fb7fdb3b96284fd1df814a" FOREIGN KEY ("apiEndpointUuid") REFERENCES "api_endpoint"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      )
    }
    const existingApiEndpointFkAggregateTraceDataHourly =
      await getExistingConstraint(
        queryRunner,
        "FK_6a02afe76e82205164afd3f0376",
        "aggregate_trace_data_hourly",
      )
    if (!existingApiEndpointFkAggregateTraceDataHourly[0]) {
      await queryRunner.query(
        `ALTER TABLE "aggregate_trace_data_hourly" ADD CONSTRAINT "FK_6a02afe76e82205164afd3f0376" FOREIGN KEY ("apiEndpointUuid") REFERENCES "api_endpoint"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      )
    }
    const existingApiEndpointFkAttack = await getExistingConstraint(
      queryRunner,
      "FK_7ad5122a8059eb424d16dbf674e",
      "attack",
    )
    if (!existingApiEndpointFkAttack[0]) {
      await queryRunner.query(
        `ALTER TABLE "attack" ADD CONSTRAINT "FK_7ad5122a8059eb424d16dbf674e" FOREIGN KEY ("apiEndpointUuid") REFERENCES "api_endpoint"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attack" DROP CONSTRAINT "FK_7ad5122a8059eb424d16dbf674e"`,
    )
    await queryRunner.query(
      `ALTER TABLE "aggregate_trace_data_hourly" DROP CONSTRAINT "FK_6a02afe76e82205164afd3f0376"`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_endpoint_test" DROP CONSTRAINT "FK_86fe6fb7fdb3b96284fd1df814a"`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_trace" DROP CONSTRAINT "FK_e8f3eb3f1d074dc4ddcfdb91516"`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" DROP CONSTRAINT "FK_8a9c958f18d171609007044d6ac"`,
    )
    await queryRunner.query(
      `ALTER TABLE "alert" DROP CONSTRAINT "FK_a7efd92cbc6de6ba3a202193cf1"`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" DROP CONSTRAINT "FK_81606413c90c1e2a80fd96ec5f6"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7ad5122a8059eb424d16dbf674"`,
    )
    await queryRunner.query(`DROP TABLE "attack"`)
    await queryRunner.query(`DROP TYPE "public"."attack_type_enum"`)
    await queryRunner.query(`DROP TABLE "aggregate_trace_data_hourly"`)
    await queryRunner.query(`DROP TABLE "authentication_config"`)
    await queryRunner.query(`DROP TYPE "public"."auth_type_enum"`)
    await queryRunner.query(`DROP TABLE "instance_settings"`)
    await queryRunner.query(`DROP TABLE "block_fields"`)
    await queryRunner.query(`DROP TYPE "public"."disable_rest_method_enum"`)
    await queryRunner.query(`DROP TABLE "api_key"`)
    await queryRunner.query(`DROP TYPE "public"."api_key_type_enum"`)
    await queryRunner.query(`DROP TABLE "api_endpoint_test"`)
    await queryRunner.query(`DROP TABLE "connections"`)
    await queryRunner.query(`DROP TYPE "public"."connection_type_enum"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_28c5d1d16da7908c97c9bc2f74"`,
    )
    await queryRunner.query(`DROP TABLE "session"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e8f3eb3f1d074dc4ddcfdb9151"`,
    )
    await queryRunner.query(`DROP TABLE "api_trace"`)
    await queryRunner.query(`DROP TABLE "api_endpoint"`)
    await queryRunner.query(`DROP TYPE "public"."rest_method_enum"`)
    await queryRunner.query(`DROP TABLE "open_api_spec"`)
    await queryRunner.query(`DROP TYPE "public"."spec_extension_enum"`)
    await queryRunner.query(`DROP TABLE "alert"`)
    await queryRunner.query(`DROP TYPE "public"."alert_status_enum"`)
    await queryRunner.query(`DROP TYPE "public"."riskscore_enum"`)
    await queryRunner.query(`DROP TYPE "public"."alert_type_enum"`)
    await queryRunner.query(`DROP TABLE "data_field"`)
    await queryRunner.query(`DROP TYPE "public"."data_section_enum"`)
    await queryRunner.query(`DROP TYPE "public"."data_tag_enum"`)
    await queryRunner.query(`DROP TYPE "public"."data_type_enum"`)
    await queryRunner.query(`DROP TYPE "public"."data_class_enum"`)
  }
}
