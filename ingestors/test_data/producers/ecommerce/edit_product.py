from datetime import datetime, timedelta
from typing import List
from uuid import uuid4
import json
from random import randint

from producers.ecommerce.utils import sources, destinations
from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer


class EcommerceEditProductProducer(BaseProducer):

    avg_emit_delta = timedelta(seconds=5)

    def get_data_points_helper(self) -> dict:
        product_uuid = str(uuid4())
        resp = {
            "status": 200,
            "headers": [JSON_HEADER],
            "body": json.dumps({
                "ok": True,
            }),
        }
        req_body = {
            "name": self.fake.word(),
            "description": self.fake.sentence(),
            "price": randint(100, 1000),
        }
        return {
            "request": {
                "url": {
                    "host": "test-ecommerce.metlo.com",
                    "path": f"/product/{product_uuid}",
                    "parameters": []
                },
                "headers": [get_auth_header()],
                "method": "POST",
                "body": json.dumps(req_body),
            },
            "response": resp, 
            "meta": get_meta(sources, destinations),
        }

    def get_data_points(self, time: datetime) -> List[dict]:
        return [self.get_data_points_helper()]
