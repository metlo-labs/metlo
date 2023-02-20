import { parse, PeggySyntaxError } from "../resource-def/test_resource_config"
import {
  ResourceConfigParseRes,
  TestResourceConfigSchema,
} from "types/resource_config"

export const parseResourceConfig = (input: string): ResourceConfigParseRes => {
  try {
    const parsed = parse(input)
    const data = TestResourceConfigSchema.safeParse(parsed)
    if (data.success == false) {
      return {
        zerr: data.error,
      }
    }
    return {
      res: data.data,
    }
  } catch (err) {
    return {
      parseError: err as PeggySyntaxError,
    }
  }
}
