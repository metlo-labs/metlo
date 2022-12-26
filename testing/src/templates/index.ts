import { TestTemplate } from "./types"
import BOLAV1 from "./bola-v1"
import BrokenAuthenticationV1 from "./broken-authentication-v1"
import GenericV1 from "./generic-v1"
import HSTSV1 from "./hsts-v1"

export const TEMPLATES: TestTemplate[] = [
  BOLAV1,
  BrokenAuthenticationV1,
  GenericV1,
  HSTSV1
]
