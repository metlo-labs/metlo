from datetime import datetime, timedelta
import os
from random import choice
from typing import List

from producers.base import BaseProducer


class EcommerceGetCartProducer(BaseProducer):

    avg_emit_delta = timedelta(seconds=1)

    def get_data_points_helper(self, carts: dict) -> dict:
        cart_uuid = choice(list(carts.values()))["uuid"] if len(carts) > 0 else ""
        return {
            "method": "get",
            "path": f"/cart/{cart_uuid}",
            "params": {},
            "header": True
        }

    def get_data_points(self, time: datetime, products=None, carts=None, rps=15) -> List[dict]:
        if len(carts) <= 1:
            return None
        return [self.get_data_points_helper(carts) for _ in range(rps)]
