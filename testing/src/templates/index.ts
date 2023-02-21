import { TestTemplate } from "./types"
import BOLAV1 from "./bola-v1"
import BOLA_ADMINV1 from "./bola-admin-v1"
import BOLA_MULTIV1 from "./bola-multi-tenant-v1"
import BrokenAuthenticationV1 from "./broken-authentication-v1"
import GenericV1 from "./generic-v1"
import HSTSV1 from "./hsts-v1"
import CSPV1 from "./csp-v1"
import SQLI_TIME_BASEDV1 from "./sqli-time-v1"
import ValidateAuthRulesV1 from "./validate-auth-rules-v1"

export const TEMPLATES: TestTemplate[] = [
  BOLAV1,
  BOLA_ADMINV1,
  BOLA_MULTIV1,
  BrokenAuthenticationV1,
  GenericV1,
  HSTSV1,
  CSPV1,
  SQLI_TIME_BASEDV1,
  ValidateAuthRulesV1,
]
