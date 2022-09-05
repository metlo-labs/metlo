import { AppDataSource } from "data-source"
import { Error400BadRequest } from "errors"
import { Product, User, Warehouse } from "models"
import { AddNewProductParams } from "types"

export class ProductService {
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

    const wareHouseRepository = AppDataSource.getRepository(Warehouse)
    const productRepository = AppDataSource.getRepository(Product)
    let existingWarehouse = await wareHouseRepository.findOneBy({
      address: warehouseAddress,
    })
    if (!existingWarehouse) {
      const wareHouseCount = await wareHouseRepository.count()
      existingWarehouse = wareHouseRepository.create()
      existingWarehouse.address = warehouseAddress
      existingWarehouse.name = `Warehouse ${wareHouseCount}`
    }
    const product = productRepository.create()
    product.name = name
    product.description = description
    product.price = price
    product.warehouse = existingWarehouse
    product.owner = user
    await wareHouseRepository.save(existingWarehouse)
    await productRepository.save(product)
    return product.uuid
  }

  static async getProduct(productUuid: string) {
    const productRepository = AppDataSource.getRepository(Product)
    const product = await productRepository.findOne({
      select: {
        owner: {
          firstName: true,
          lastName: true,
          email: true,
          dob: true,
          phoneNumber: true,
          address: true,
        },
      },
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
