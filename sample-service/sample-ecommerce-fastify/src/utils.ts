import bcrypt from "bcryptjs"
import { StringHashError } from "errors"

export const NEW_VAL_LIMIT =
  (process.env.NEW_VAL_LIMIT || "false").toLowerCase() == "true"
const SALT_ROUNDS = 10

export const hashString = async (plaintext: string): Promise<string> => {
  try {
    const hashed = await bcrypt.hash(plaintext, SALT_ROUNDS)
    return hashed
  } catch (err) {
    throw new StringHashError(err.message)
  }
}
