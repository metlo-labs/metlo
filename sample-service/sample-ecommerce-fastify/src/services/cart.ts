import { AppDataSource } from "data-source"
import { Error400BadRequest, Error404NotFound } from "errors"
import { Cart, User } from "models"
import { PurchaseCartParams } from "types"
import { NEW_VAL_LIMIT } from "utils"
import { ProductService } from "./product"

export class CartService {
  static async createNewCart() {
    const queryRunner = AppDataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      const numCurrCarts = await queryRunner.manager.count(Cart)
      const cart = queryRunner.manager.create(Cart)
      if (!NEW_VAL_LIMIT || numCurrCarts < 20) {
        await queryRunner.manager.insert(Cart, cart)
      }
      return cart.uuid
    } catch (err) {
      console.error(`Error in CartService.createNewCart: ${err}`)
      throw err
    } finally {
      queryRunner.release()
    }
  }

  static async getCarts() {
    try {
      const cartRepository = AppDataSource.getRepository(Cart)
      return await cartRepository.find({})
    } catch (err) {
      throw err
    }
  }

  static async getCart(cartUuid: string) {
    try {
      const cartRepository = AppDataSource.getRepository(Cart)
      const cart = await cartRepository.findOne({
        where: {
          uuid: cartUuid,
        },
        relations: {
          products: true,
        },
      })
      return cart
    } catch (err) {
      console.error(`Error in CartService.getCart: ${err}`)
      throw err
    }
  }

  static async addProduct(cartUuid: string, productUuid: string, user: User) {
    try {
      const cartRepository = AppDataSource.getRepository(Cart)
      const product = await ProductService.getProduct(productUuid, user)
      if (!product) {
        throw new Error404NotFound("Product to add to cart not found.")
      }
      const cart = await this.getCart(cartUuid)
      if (!cart) {
        throw new Error404NotFound("Cart not found.")
      }
      for (const item of cart.products) {
        if (item.uuid === product.uuid) {
          return
        }
      }
      cart.products.push(product)
      await cartRepository.save(cart)
      return
    } catch (err) {
      console.error(`Error in CartService.addProduct: ${err}`)
      throw err
    }
  }

  static async purchaseCart(
    cartUuid: string,
    purchaseCartParams: PurchaseCartParams,
  ) {
    try {
      const cart = await this.getCart(cartUuid)
      if (!cart) {
        throw new Error404NotFound("Cart not found.")
      }
      const { firstName, lastName, ccn, code, expirationDate, address } =
        purchaseCartParams
      if (
        !firstName ||
        !lastName ||
        !ccn ||
        !code ||
        !expirationDate ||
        !address
      ) {
        throw new Error400BadRequest(
          "Please provide first name, last name, ccn, code, expiration date, address.",
        )
      }
      return { ccn: purchaseCartParams.ccn }
    } catch (err) {
      console.error(`Error in CartService.purchaseCart: ${err}`)
      throw err
    }
  }
}
