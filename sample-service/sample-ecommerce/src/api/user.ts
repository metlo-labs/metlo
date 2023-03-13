import { FastifyReply, FastifyRequest } from "fastify"
import ApiResponseHandler from "api-response-handler"
import { UserService } from "services/user"
import { LoginUserParams, RegisterUserParams } from "types"

export const registerUserHandler = async (
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> => {
  try {
    const registerUserParams: RegisterUserParams =
      req.body as RegisterUserParams
    let user = await UserService.registerUser(registerUserParams)
    delete user.hashedPassword
    const payload = {
      msg: "Successfully registered user",
      user,
    }
    await ApiResponseHandler.success(res, payload)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const loginUserHandler = async (
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> => {
  try {
    const loginUserParams: LoginUserParams = req.body as LoginUserParams
    const userPayload = await UserService.loginUser(loginUserParams)
    await ApiResponseHandler.success(res, userPayload)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
