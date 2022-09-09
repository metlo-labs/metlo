import dotenv from "dotenv"
import { MetloConfig } from "./types"

export const CREDENTIAL_FILE = ".metlo/credentials"

export const getConfig = (): MetloConfig => {
  return {
    metloHost: "http://localhost:8080"
  }
}
