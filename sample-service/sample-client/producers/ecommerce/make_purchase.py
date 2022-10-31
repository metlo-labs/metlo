from datetime import datetime, timedelta
import os
from typing import List
from random import choice

from producers.base import BaseProducer


class EcommerceMakePurchaseProducer(BaseProducer):

    avg_emit_delta = timedelta(seconds=1)

    def get_data_points_helper(self, carts: dict) -> dict:
        cart_uuid = choice(list(carts.values()))["uuid"] if len(carts) > 0 else ""
        ccn = self.fake.credit_card_number()
        req_body = {
            "firstName": self.fake.first_name(),
            "lastName": self.fake.first_name(),
            "ccn": ccn,
            "expirationDate": self.fake.credit_card_expire(),
            "code": self.fake.credit_card_security_code(),
            "address": self.fake.address(),
        }
        return {
            "method": "post",
            "path": f"/cart/{cart_uuid}/purchase",
            "body": req_body,
            "header": True
        }

    def get_data_points(self, time: datetime, products=None, carts=None, rps=15) -> List[dict]:
        if len(carts) <= 1:
            return None
        return [self.get_data_points_helper(carts) for _ in range(rps)]
