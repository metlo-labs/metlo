import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import fastifyMultipart from "@fastify/multipart"
import dotenv from "dotenv"
import { Cart, Product, User, Warehouse } from "models"
import { AppDataSource } from "data-source"
import { hashString } from "utils"
import { loginUserHandler, registerUserHandler } from "api/user"
import {
  addProductHandler,
  createNewCartHandler,
  getCartHandler,
  getCartsHandler,
  purchaseCartHandler,
} from "api/cart"
import {
  createNewProductHandler,
  editProductHandler,
  editProductPriceHandler,
  getProductHandler,
  getProductsHandler,
} from "api/product"
import { UserService } from "services/user"
import { Error401UnauthorizedRequest } from "errors"
import ApiResponseHandler from "api-response-handler"
import { editAdminConfig, getAdminConfig } from "api/admin"

dotenv.config()

declare module "fastify" {
  export interface FastifyRequest {
    user: User
  }
}

const app: FastifyInstance = Fastify({})
const port = Number(process.env.PORT) || 8080

app.register(fastifyMultipart, { attachFieldsToBody: true })

app.register((fastify, options, next) => {
  fastify.get("/", async (request, reply) => {
    return "OK"
  })
  fastify.post("/register", registerUserHandler)
  fastify.post("/login", loginUserHandler)
  next()
})

app.register((fastify, options, next) => {
  fastify.addHook("onRequest", async (req, res) => {
    const apiKey = req.headers["x-api-key"]
    try {
      if (apiKey && typeof apiKey === "string") {
        const user = await UserService.findUserByApiKey(apiKey)
        if (!user) {
          throw new Error401UnauthorizedRequest(
            "Unauthorized access. Unknown API Key.",
          )
        }
        req.user = user
        next()
      } else {
        throw new Error401UnauthorizedRequest(
          "Unauthorized access. Please add `X-API-Key` header.",
        )
      }
    } catch (err) {
      await ApiResponseHandler.error(res, err)
    }
  })

  fastify.post(
    "/clear-data",
    async (req: FastifyRequest, res: FastifyReply): Promise<void> => {
      if (req.user.apiKey != process.env.API_KEY) {
        return await ApiResponseHandler.success(res, "UNAUTHORIZED")
      }
      try {
        await AppDataSource.getRepository(Product).delete({})
        await AppDataSource.getRepository(Cart).delete({})
        await AppDataSource.getRepository(Warehouse).delete({})
        await AppDataSource.getRepository(User).delete({})
        await initializeUser()
        await ApiResponseHandler.success(res, "OK")
      } catch (err) {
        console.log(err)
        await ApiResponseHandler.error(res, err)
      }
    },
  )

  fastify.get("/cart", getCartsHandler)
  fastify.get("/cart/:cartUuid", getCartHandler)
  fastify.post("/cart/new", createNewCartHandler)
  fastify.post("/cart/:cartUuid/add-product", addProductHandler)
  fastify.post("/cart/:cartUuid/purchase", purchaseCartHandler)

  fastify.get("/product", getProductsHandler)
  fastify.get("/product/:productUuid", getProductHandler)
  fastify.post("/product/:productUuid", editProductHandler)
  fastify.post("/product/:productUuid/price", editProductPriceHandler)
  fastify.post("/product/new", createNewProductHandler)

  fastify.get("/admin/config", getAdminConfig)
  fastify.post("/admin/config", editAdminConfig)

  fastify.post("/product/new/form", async function (req, res) {
    try {
      const data = await req.body
      await ApiResponseHandler.success(res, "Success")
    } catch (err) {
      await ApiResponseHandler.error(res, err)
    }
  })

  fastify.post("/file-upload", async function (req, res) {
    try {
      const data = await req.file()
      await ApiResponseHandler.success(res, "Success")
    } catch (err) {
      await ApiResponseHandler.error(res, err)
    }
  })

  fastify.post("/file-upload/multiple", async function (req, res) {
    try {
      const files = req.files()
      await ApiResponseHandler.success(res, "Success")
    } catch (err) {
      await ApiResponseHandler.error(res, err)
    }
  })

  fastify.post("/file-upload/large-response", async function (req, res) {
    try {
      const data = await req.file()
      const resp = "x".repeat(10 * 1024 * 1024)
      await ApiResponseHandler.success(res, resp)
    } catch (err) {
      await ApiResponseHandler.error(res, err)
    }
  })

  fastify.get("/large-response", async function (req, res) {
    try {
      const resp = "x".repeat(10 * 1024 * 1024)
      await ApiResponseHandler.success(res, resp)
    } catch (err) {
      await ApiResponseHandler.error(res, err)
    }
  })

  next()
})

const initializeUser = async () => {
  const user = AppDataSource.getRepository(User).create()
  user.firstName = process.env.FIRST_NAME
  user.lastName = process.env.LAST_NAME
  user.email = process.env.EMAIL
  user.hashedPassword = await hashString(process.env.PASSWORD)
  user.dob = process.env.DOB
  user.role = "admin"
  user.apiKey = process.env.API_KEY
  user.phoneNumber = process.env.PHONE_NUMBER
  user.address = process.env.ADDRESS
  await user.save()
}

const main = async () => {
  try {
    const datasource = await AppDataSource.initialize()
    console.log(
      `Is AppDataSource Initialized? ${
        datasource.isInitialized ? "Yes" : "No"
      }`,
    )
    await initializeUser()
    app.listen({ port, host: "0.0.0.0" }, () => {
      console.log(
        `⚡️[server]: Fastify Server is running at http://localhost:${port}`,
      )
    })
  } catch (err) {
    console.error(`CatchBlockInsideMain: ${err}`)
  }
}

main().catch(err => {
  console.error(`Error in main try block: ${err}`)
})
