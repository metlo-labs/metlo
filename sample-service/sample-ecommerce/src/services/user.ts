import { randomBytes } from "crypto"
import bcrypt from "bcrypt"
import { AppDataSource } from "data-source"
import { Error400BadRequest, Error404NotFound, Error409Conflict } from "errors"
import { User } from "models"
import { LoginUserParams, RegisterUserParams } from "types"
import { hashString } from "utils"

export class UserService {
  static async registerUser(registerUserParams: RegisterUserParams) {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        dob,
        phoneNumber,
        address,
      } = registerUserParams

      if (!firstName) {
        throw new Error400BadRequest("First name is required.")
      }
      if (!lastName) {
        throw new Error400BadRequest("Last name is required.")
      }
      if (!email) {
        throw new Error400BadRequest("Email is required.")
      }
      if (!password) {
        throw new Error400BadRequest("Password is required.")
      }
      if (!dob) {
        throw new Error400BadRequest("Date of Birth is required.")
      }

      const userRepository = AppDataSource.getRepository(User)
      const existingUser = await userRepository.findOneBy({ email })
      if (existingUser) {
        throw new Error409Conflict("User with email already exists.")
      }
      const user = new User()
      user.firstName = firstName
      user.lastName = lastName
      user.email = email
      user.hashedPassword = await hashString(password)
      user.dob = dob
      user.phoneNumber = phoneNumber
      user.address = address
      user.apiKey = `ecommerce_${randomBytes(16).toString("hex")}`
      await userRepository.save(user)
      return user.apiKey
    } catch (err) {
      console.error(`Error in UserService.registerUser: ${err}`)
      throw err
    }
  }

  static async loginUser(loginUserParams: LoginUserParams) {
    try {
      const { email, password } = loginUserParams
      const userRepository = AppDataSource.getRepository(User)
      const user = await userRepository.findOneBy({ email })
      if (!user) {
        throw new Error404NotFound("User not found.")
      }
      const verified = await bcrypt.compare(password, user.hashedPassword)
      if (!verified) {
        throw new Error404NotFound(
          "User not found with email/password combination.",
        )
      }
      return { uuid: user.uuid, apiKey: user.apiKey }
    } catch (err) {
      console.error(`Error in UserService.loginUser: ${err}`)
      throw err
    }
  }

  static async findUserByApiKey(apiKey: string) {
    const userRepository = AppDataSource.getRepository(User)
    return await userRepository.findOneBy({ apiKey })
  }
}
