from datetime import datetime, timedelta
import os
from typing import List
from random import choice

from producers.base import BaseProducer


class EcommerceAddProductToCartProducer(BaseProducer):

    avg_emit_delta = timedelta(seconds=1)

    def get_data_points_helper(self, products: dict, carts: dict) -> dict:
        product_uuid = choice(list(products.values()))["uuid"] if len(products) > 0 else None
        cart_uuid = choice(list(carts.values()))["uuid"] if len(carts) > 0 else None
        req_body = {
            "productUuid": product_uuid,
        }
        return {
            "method": "post",
            "path": f"/cart/{cart_uuid}/add-product",
            "body": req_body,
            "header": True
        }

    def get_data_points(self, time: datetime, products=None, carts=None, rps=15) -> List[dict]:
        if len(products) <= 1 or len(carts) <= 1:
            return None
        return [self.get_data_points_helper(products, carts) for _ in range(rps)]
