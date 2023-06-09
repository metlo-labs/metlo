from datetime import datetime, timedelta
import os
from random import choice
from typing import List

from producers.base import BaseProducer


class EcommerceGetProductProducer(BaseProducer):

    avg_emit_delta = timedelta(seconds=2)

    def get_data_points_helper(self, products: dict) -> dict:
        product_uuid = choice(list(products.values()))["uuid"] if len(products) > 0 else ""
        return {
            "method": "get",
            "path": f"/product/{product_uuid}",
            "params": {},
            "header": True
        }

    def get_data_points(self, time: datetime, products=None, carts=None, rps=15) -> List[dict]:
        return [self.get_data_points_helper(products) for _ in range(rps)]
