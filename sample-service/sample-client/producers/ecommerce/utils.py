from urllib.parse import urljoin
import requests

def get_products(backend, api_key):
    try:
        r = requests.get(
            urljoin(backend, "/product"), headers={ "x-api-key": api_key }
        )
        r.raise_for_status()
        res = r.json()
        del res["ok"]
        return res
    except requests.exceptions.HTTPError as err:
        return {}

def get_carts(backend, api_key):
    try:
        r = requests.get(
            urljoin(backend, "/cart"), headers={ "x-api-key": api_key }
        )
        r.raise_for_status()
        res = r.json()
        del res["ok"]
        return res
    except requests.exceptions.HTTPError as err:
        return {}

