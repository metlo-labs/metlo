from random import randint

sources = [
    ('205.193.67.126', 11792),
    ('32.205.184.234', 16487),
    ('5.238.34.227', 15070),
    ('46.88.97.230', 15300),
    ('153.131.151.38', 19212),
    ('33.242.31.107', 10717),
    ('103.27.219.3', 18795),
    ('24.53.137.177', 16851),
    ('147.251.99.115', 19284),
    ('175.233.241.193', 11392),
]

destinations = [
    ('4.219.245.8', 80),
    ('13.13.138.145', 80),
    ('98.51.9.158', 80),
]

def get_product(fake, product_uuid):
    return {
        "uuid": product_uuid,
        "productName": fake.word(),
        "productDescription": fake.sentence(),
        "warehouseAddress": fake.address(),
        "price": randint(100, 1000),
    }