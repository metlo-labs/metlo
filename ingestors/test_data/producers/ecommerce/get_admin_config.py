from datetime import datetime, timedelta
from typing import List
import json
from random import randint

from producers.ecommerce.utils import sources, destinations
from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer


class EcommerceGetAdminConfigProducer(BaseProducer):

    emit_probability = 0.1

    def get_data_points_helper(self) -> dict:
        resp = {
            "status": 200,
            "headers": [JSON_HEADER],
            "body": json.dumps({
                "max_products": randint(100, 1000),
                "max_carts": randint(10000, 100000),
                "foo": "bar",
            }),
        }
        return {
            "request": {
                "url": {
                    "host": "test-ecommerce.metlo.com",
                    "path": f"/admin/config",
                    "parameters": []
                },
                "headers": [get_auth_header()],
                "method": "GET",
            },
            "response": resp, 
            "meta": get_meta(sources, destinations),
        }

    def get_data_points(self) -> List[dict]:
        return [self.get_data_points_helper()]
