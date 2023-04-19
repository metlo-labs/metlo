export enum AWS_SOURCE_TYPE {
  INSTANCE = "instance",
  NETWORK_INTERFACE = "network-interface",
  ALB = "application-load-balancer",
  ECS = "container-service",
}

export enum Protocols {
  TCP = 6,
  UDP = 17,
}

export enum ConnectionType {
  AWS = "AWS",
  GCP = "GCP",
}

export interface MachineSpecifications {
  minCpu: number
  maxCpu: number
  minMem: number
  maxMem?: number
}

export interface TrafficFilterRuleSpecs {
  destination_CIDR: string
  source_CIDR: string
  source_port?: string
  destination_port?: string
  protocol: Protocols
  direction: "out" | "in"
}
