from datetime import datetime, timedelta
from typing import List
from uuid import uuid4
import json

from producers.ecommerce.utils import sources, destinations
from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer


class EcommerceMakeCartProducer(BaseProducer):

    avg_emit_delta = timedelta(seconds=5)

    def get_data_points_helper(self) -> dict:
        resp_body = {
            "ok": True,
            "cart_uuid": str(uuid4()),
            "msg": "New Cart."
        }
        return {
            "request": {
                "url": {
                    "host": "test-ecommerce.metlo.com",
                    "path": "/cart",
                    "parameters": []
                },
                "headers": [get_auth_header()],
                "method": "POST",
                "body": "",
            },
            "response": {
                "status": 200,
                "headers": [JSON_HEADER],
                "body": json.dumps(resp_body),
            },
            "meta": get_meta(sources, destinations),
        }

    def get_data_points(self, time: datetime) -> List[dict]:
        return [self.get_data_points_helper()]
