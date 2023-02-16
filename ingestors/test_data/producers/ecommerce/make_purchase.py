from datetime import datetime, timedelta
from typing import List
from uuid import uuid4
import json
from random import choices

from producers.ecommerce.utils import sources, destinations
from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer


class EcommerceMakePurchaseProducer(BaseProducer):

    avg_emit_delta = timedelta(seconds=5)

    def get_data_points_helper(self) -> dict:
        cart_uuid = str(uuid4())
        ccn = self.fake.credit_card_number()
        responses = [
            {
                "status": 200,
                "headers": [JSON_HEADER],
                "body": json.dumps({
                    "ok": True,
                    "msg": "Completed Purchase.",
                    "ccn": ccn
                }),
            },
            {
                "status": 500,
                "headers": [JSON_HEADER],
                "body": json.dumps({
                    "ok": False,
                    "msg": "Failed to completed purchase."
                }),
            }
        ]
        req_body = {
            "cart_uuid": cart_uuid,
            "name": self.fake.name(),
            "ccn": "648.064.371-23",
            "cc_exp": self.fake.credit_card_expire(),
            "cc_code": self.fake.credit_card_security_code(),
            "address": self.fake.address(),
        }
        return {
            "request": {
                "url": {
                    "host": "test-ecommerce.metlo.com",
                    "path": f"/cart/{cart_uuid}/purchase",
                    "parameters": []
                },
                "headers": [get_auth_header()],
                "method": "POST",
                "body": json.dumps(req_body),
            },
            "response": choices(responses, [5, 1], k=1)[0], 
            "meta": get_meta(sources, destinations),
        }

    def get_data_points(self, time: datetime) -> List[dict]:
        return [self.get_data_points_helper()]
