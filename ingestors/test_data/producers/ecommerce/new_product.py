from datetime import datetime, timedelta
from typing import List
from uuid import uuid4
import json
from random import randint

from producers.ecommerce.utils import sources, destinations
from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer


class EcommerceMakeProductProducer(BaseProducer):

    emit_probability = 0.02

    def get_data_points_helper(self) -> dict:
        resp_body = {
            "ok": True,
            "productUuid": str(uuid4()),
            "msg": "New Product Created..."
        }
        req_body = {
            "name": "Test Product",
            "productName": self.fake.word(),
            "productDescription": self.fake.sentence(),
            "warehouseAddress": self.fake.address(),
            "price": randint(100, 1000),
        }
        return {
            "request": {
                "url": {
                    "host": "test-ecommerce.metlo.com",
                    "path": "/product",
                    "parameters": []
                },
                "headers": [get_auth_header(), JSON_HEADER],
                "method": "POST",
                "body": json.dumps(req_body),
            },
            "response": {
                "status": 200,
                "headers": [JSON_HEADER],
                "body": json.dumps(resp_body),
            },
            "meta": get_meta(sources, destinations),
        }

    def get_data_points(self) -> List[dict]:
        return [self.get_data_points_helper()]
