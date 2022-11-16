import { RiskScore, DataClass, DataTag, Status } from "@common/enums"

export const PIE_BACKGROUND_COLORS = [
  "rgba(255, 99, 132, 0.8)",
  "rgba(54, 162, 235, 0.8)",
  "rgba(255, 206, 86, 0.8)",
  "rgba(75, 192, 192, 0.8)",
  "rgba(153, 102, 255, 0.8)",
  "rgba(255, 159, 64, 0.8)",
  "rgba(94, 205, 160, 0.8)",
  "rgba(221, 118, 58, 0.8)",
  "rgba(180, 215, 174, 0.8)",
  "rgba(221, 200, 165, 0.8)",
]

export const PIE_BORDER_COLORS = [
  "rgba(255, 99, 132, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(255, 206, 86, 1)",
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255, 159, 64, 1)",
  "rgba(94, 205, 160, 1)",
  "rgba(221, 118, 58, 1)",
  "rgba(180, 215, 174, 1)",
  "rgba(221, 200, 165, 1)",
]

export const METHOD_TO_COLOR = {
  GET: "green",
  POST: "orange",
}

export const RISK_TO_COLOR = {
  [RiskScore.NONE]: "green",
  [RiskScore.LOW]: "gray",
  [RiskScore.MEDIUM]: "orange",
  [RiskScore.HIGH]: "red",
}

export const STATUS_TO_COLOR = {
  [Status.RESOLVED]: "green",
  [Status.IGNORED]: "gray",
  [Status.OPEN]: "blue",
}

export const TAG_TO_COLOR = {
  [DataTag.PII]: "blue",
}

export const RISK_SCORE_ORDER: Record<RiskScore, number> = {
  [RiskScore.HIGH]: 3,
  [RiskScore.MEDIUM]: 2,
  [RiskScore.LOW]: 1,
  [RiskScore.NONE]: 0,
}

export const statusToColor = (statusCode: number) => {
  if (statusCode >= 200 && statusCode < 300) {
    return "green"
  }
  return "red"
}
export const getAPIURL = () => {
  return `${
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.BACKEND_URL || "http://localhost:8080"
  }/api/v1`
}

export const ENDPOINT_PAGE_LIMIT = 10
export const ALERT_PAGE_LIMIT = 10
export const ATTACK_PAGE_LIMIT = 10

export const INGESTOR_AWS_REGIONS = [
  "us-west-1",
  "us-west-2",
  "us-east-1",
  "us-east-2",
  "ap-south-1",
  "ap-northeast-3",
  "ap-northeast-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ca-central-1",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-north-1",
  "sa-east-1",
]

export const INGESTOR_AWS_TEMPLATE =
  "https://cf-templates-7639qxxr319s-us-west-1.s3.us-west-1.amazonaws.com/metlo-ingestor.template"
export const INGESTOR_STACK_NAME = "metlo-ingestor"

export const getAWSIngestorLaunchStackURL = (region: string) =>
  `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/create/review?templateURL=${INGESTOR_AWS_TEMPLATE}&stackName=${INGESTOR_STACK_NAME}`

export const getAWSDeployAmiURL = (region: string) =>
  `https://backend.metlo.com/traffic-mirror/aws?region=${region}`
