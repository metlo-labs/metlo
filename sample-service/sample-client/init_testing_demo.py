import argparse
import requests

from faker import Faker
fake = Faker()


def main(backend, api_key):
    headers = { "x-api-key": api_key }
    r = requests.post(f"{backend}/clear-data", headers=headers)
    if r.status_code > 300:
        print("Clear Data")
        print(r.status_code)
        print(r.text)
        return

    r = requests.post(
        f"{backend}/register",
        json={
            "firstName": "Test 1",
            "lastName": "Admin User 1",
            "email": "admin_user_1@metlo.com",
            "role": "admin",
            "address": fake.address(),
            "phoneNumber": fake.phone_number(),
            "dob": fake.date_of_birth().isoformat(),
            "password": fake.sentence(nb_words=5),
        },
        headers=headers
    )
    if r.status_code > 300:
        print("Register Admin User 1")
        print(r.status_code)
        print(r.text)
        return
    admin_user_1 = r.json()['user']
    admin_user_1_api_key = admin_user_1['apiKey']

    r = requests.post(
        f"{backend}/register",
        json={
            "firstName": "Test 1",
            "lastName": "Regular User 1",
            "email": "regular_user_1@metlo.com",
            "role": "regular",
            "address": fake.address(),
            "phoneNumber": fake.phone_number(),
            "dob": fake.date_of_birth().isoformat(),
            "password": fake.sentence(nb_words=5),
        },
        headers=headers
    )
    if r.status_code > 300:
        print("Register User 1")
        print(r.status_code)
        print(r.text)
        return
    user_1 = r.json()['user']
    user_1_api_key = user_1['apiKey']

    r = requests.post(
        f"{backend}/register",
        json={
            "firstName": "Test 2",
            "lastName": "Regular User 2",
            "email": "regular_user_2@metlo.com",
            "role": "regular",
            "address": fake.address(),
            "phoneNumber": fake.phone_number(),
            "dob": fake.date_of_birth().isoformat(),
            "password": fake.sentence(nb_words=5),
        },
        headers=headers
    )
    if r.status_code > 300:
        print("Register User 2")
        print(r.status_code)
        print(r.text)
        return
    user_2 = r.json()['user']
    user_2_api_key = user_2['apiKey']

    user_1_headers = { "x-api-key": user_1_api_key }
    user_2_headers = { "x-api-key": user_2_api_key }

    product_1_name = fake.word()
    r = requests.post(
        f"{backend}/product/new",
        json={
            "name": product_1_name,
            "description": fake.sentence(),
            "warehouseAddress": fake.address(),
            "price": 1000,
        },
        headers=user_1_headers
    )
    if r.status_code > 300:
        print("Register Product 1")
        print(r.status_code)
        print(r.text)
        return
    user_1_product = r.json()['productId']

    product_2_name = fake.word()
    r = requests.post(
        f"{backend}/product/new",
        json={
            "name": product_2_name,
            "description": fake.sentence(),
            "warehouseAddress": fake.address(),
            "price": 1000,
        },
        headers=user_2_headers
    )
    if r.status_code > 300:
        print("Register Product 2")
        print(r.status_code)
        print(r.text)
        return
    user_2_product = r.json()['productId']

    print(f'''
host "test-ecommerce.metlo.com" {{
    authType = "header",
    headerKey = "X-API-KEY"
}}

actor User {{
    items = [
        {{
            "uuid": "{admin_user_1['uuid']}",
            "role": "admin",
            "auth": "{admin_user_1['apiKey']}"
        }},
        {{
            "uuid": "{user_1['uuid']}",
            "role": "regular",
            "auth": "{user_1['apiKey']}"
        }},
        {{
            "uuid": "{user_2['uuid']}",
            "role": "regular",
            "auth": "{user_2['apiKey']}"
        }}
    ]
}}

resource Product {{
    permissions = ["read", "write"],
    items = [
        {{
            "uuid": "{user_1_product}",
            "name": "{product_1_name}"
        }},
        {{
            "uuid": "{user_2_product}",
            "name": "{product_2_name}"
        }}
    ],
    endpoints = [
        {{
            "method": "GET",
            "path": "/product/.*",
            "permissions": ["read"]
        }},
        {{
            "method": "POST",
            "path": "/product/.*",
            "permissions": ["write"]
        }}
    ]
}}

resource AdminAccess {{
    permissions = ["read", "write"],
    endpoints = [
        {{
            "method": "GET",
            "path": "/admin/.*",
            "permissions": ["read"]
        }},
        {{
            "method": "POST",
            "path": "/admin/.*",
            "permissions": ["write"]
        }}
    ]
}}

has_permission(User(role="admin"), [ "read", "write" ], AdminAccess)
has_permission(User, [ "read" ], Product)
has_permission(User(role="admin"), [ "write" ], Product)
has_permission(User(uuid="{user_1['uuid']}"), [ "write" ], Product(uuid="{user_1_product}"))
has_permission(User(uuid="{user_2['uuid']}"), [ "write" ], Product(uuid="{user_2_product}"))
'''.strip())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-b", "--backend", required=True)
    parser.add_argument("-k", "--api_key", required=True)
    args = parser.parse_args()
    backend = args.backend
    api_key = args.api_key
    main(backend, api_key)
