from datetime import datetime, timedelta
from typing import List

from producers.base import BaseProducer


class EcommerceLoginProducer(BaseProducer):

    avg_emit_delta = timedelta(minutes=5)

    def get_data_points_helper(self) -> dict:
        req_body = {
            "email": self.fake.free_email(),
            "password": self.fake.sentence(nb_words=5),
        }
        return {
            "method": "post",
            "path": "/login",
            "body": req_body,
            "header": False
        }

    def get_data_points(self, time: datetime, products=None, carts=None, rps=8) -> List[dict]:
        return [self.get_data_points_helper() for _ in range(8)]
