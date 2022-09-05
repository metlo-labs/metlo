from random import randint


def get_product(fake, product_uuid):
    return {
        "uuid": product_uuid,
        "productName": fake.word(),
        "productDescription": fake.sentence(),
        "warehouseAddress": fake.address(),
        "price": randint(100, 1000),
    }