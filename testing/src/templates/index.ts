import { TestTemplate } from "./types"
import BOLAV1 from "./bola-v1"
import BrokenAuthenticationV1 from "./broken-authentication-v1"
import GenericV1 from "./generic-v1"

export const TEMPLATES: TestTemplate[] = [
  BOLAV1,
  BrokenAuthenticationV1,
  GenericV1,
]
