import express, { Express, Request, Response } from "express"
import dotenv from "dotenv"
import { AppDataSource } from "data-source"
import { loginUserHandler, registerUserHandler } from "api/user"
import { User } from "models"
import { authMiddleware } from "middleware/auth-middleware"
import {
  addProductHandler,
  createNewCartHandler,
  getCartHandler,
  getCartsHandler,
  purchaseCartHandler,
} from "api/cart"
import { createNewProductHandler, getProductHandler, getProductsHandler } from "api/product"
import { hashString } from "utils"

dotenv.config()

declare global {
  namespace Express {
    export interface Request {
      user?: User
    }
  }
}

const app: Express = express()
const port = process.env.PORT || 8080

app.disable("x-powered-by")
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", (req: Request, res: Response) => {
  res.send("OK")
})

app.post("/register", registerUserHandler)
app.post("/login", loginUserHandler)

app.get("/product/:productUuid", getProductHandler)

app.use(authMiddleware)

app.get("/cart", getCartsHandler)
app.get("/cart/:cartUuid", getCartHandler)
app.post("/cart/new", createNewCartHandler)
app.post("/cart/:cartUuid/add-product", addProductHandler)
app.post("/cart/:cartUuid/purchase", purchaseCartHandler)

app.get("/product", getProductsHandler)
app.post("/product/new", createNewProductHandler)

const initializeUser = async () => {
  const user = AppDataSource.getRepository(User).create()
  user.firstName = process.env.FIRST_NAME
  user.lastName = process.env.LAST_NAME
  user.email = process.env.EMAIL
  user.hashedPassword = await hashString(process.env.PASSWORD)
  user.dob = process.env.DOB
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
    app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
    })
  } catch (err) {
    console.error(`CatchBlockInsideMain: ${err}`)
  }
}

main().catch(err => {
  console.error(`Error in main try block: ${err}`)
})
