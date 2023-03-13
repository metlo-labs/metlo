import { AppDataSource } from "data-source"
import { Error400BadRequest, Error401UnauthorizedRequest } from "errors"
import { Product, User, Warehouse } from "models"
import { AddNewProductParams } from "types"
import { NEW_VAL_LIMIT } from "utils"

export class ProductService {
  static async editProduct(
    uuid: string,
    params: AddNewProductParams,
    user: User,
  ) {
    const { name, description, price } = params
    if (!name || !description || !price) {
      throw new Error400BadRequest(
        "Please provide product name, description and price.",
      )
    }
    let product = await ProductService.getProduct(uuid, user)
    if (product.owner.uuid != user.uuid && user.role != "admin") {
      throw new Error401UnauthorizedRequest("No access to this product")
    }
    product.name = name
    product.description = description
    product.price = price
    product.save()
  }

  static async addNewProduct(
    addNewProductParams: AddNewProductParams,
    user: User,
  ) {
    const { name, description, price, warehouseAddress } = addNewProductParams
    if (!name || !description || !price || !warehouseAddress) {
      throw new Error400BadRequest(
        "Please provide product name, description, price, and warehouse address.",
      )
    }
    const queryRunner = AppDataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      const numCurrProducts = await queryRunner.manager.count(Product)
      const product = queryRunner.manager.create(Product)
      if (!NEW_VAL_LIMIT || numCurrProducts < 15) {
        let existingWarehouse = await queryRunner.manager.findOneBy(Warehouse, {
          address: warehouseAddress,
        })
        if (!existingWarehouse) {
          const wareHouseCount = await queryRunner.manager.count(Warehouse)
          existingWarehouse = queryRunner.manager.create(Warehouse)
          existingWarehouse.address = warehouseAddress
          existingWarehouse.name = `Warehouse ${wareHouseCount}`
          await queryRunner.manager.insert(Warehouse, existingWarehouse)
        }
        product.name = name
        product.description = description
        product.price = price
        product.warehouse = existingWarehouse
        product.owner = user
        await queryRunner.manager.save(Product, product)
      }
      return product.uuid
    } catch (err) {
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  static async getProducts() {
    try {
      const productRepo = AppDataSource.getRepository(Product)
      return await productRepo.find({})
    } catch (err) {
      throw err
    }
  }

  static async getProduct(productUuid: string, user: User) {
    const productRepository = AppDataSource.getRepository(Product)
    const product = await productRepository.findOne({
      where: {
        uuid: productUuid,
      },
      relations: {
        warehouse: true,
        owner: true,
      },
    })
    return product
  }
}
