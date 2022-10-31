from datetime import datetime, timedelta
from typing import List
from random import randint

from producers.base import BaseProducer


class EcommerceMakeProductProducer(BaseProducer):

    avg_emit_delta = timedelta(seconds=1)

    def get_data_points_helper(self) -> dict:
        req_body = {
            "name": self.fake.word(),
            "description": self.fake.sentence(),
            "warehouseAddress": self.fake.address(),
            "price": randint(100, 1000),
        }
        return {
            "method": "post",
            "path": "/product/new",
            "body": req_body,
            "header": True
        }

    def get_data_points(self, time: datetime, products=None, carts=None, rps=8) -> List[dict]:
        return [self.get_data_points_helper() for _ in range(8)]
