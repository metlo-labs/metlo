from datetime import datetime, timedelta
from typing import List

from producers.base import BaseProducer


class EcommerceMakeCartProducer(BaseProducer):

    avg_emit_delta = timedelta(seconds=1)

    def get_data_points_helper(self) -> dict:
        return {
            "method": "post",
            "path": "/cart/new",
            "body": {},
            "header": True
        }

    def get_data_points(self, time: datetime, products=None, carts=None, rps=8) -> List[dict]:
        return [self.get_data_points_helper() for _ in range(8)]
