from datetime import datetime, timedelta
from typing import List
from uuid import uuid4
import json
from random import choice, randint
from faker import Faker
from faker.providers import internet

fake = Faker()
fake.add_provider(internet)


from producers.base import BaseProducer


class EcommerceMakeProductProducer(BaseProducer):

    avg_emit_delta = timedelta(minutes=5)

    def get_data_points_helper(self) -> dict:
        resp_body = {
            "ok": True,
            "cart_uuid": str(uuid4()),
            "msg": "New Product Created..."
        }
        req_body = {
            "name": "Test Product",
            "owner_name": fake.name(),
            "price": randint(100, 1000),
        }
        return {
            "request": {
                "url": {
                    "host": "test-ecommerce.metlo.com",
                    "path": "/product",
                    "parameters": []
                },
                "method": "POST",
                "body": json.dumps(req_body),
            },
            "response": {
                "status": 200,
                "headers": [
                    {
                        "name": "content-type",
                        "value": "application/json; charset=utf-8",
                    },
                ],
                "body": json.dumps(resp_body),
            },
            "meta": {
                "environment": "production",
                "incoming": True,
                "source": fake.ipv4(),
                "sourcePort": choice(range(10000, 20000)),
                "destination": "76.47.25.189",
                "destinationPort": 443,
            },
        }

    def get_data_points(self, time: datetime) -> List[dict]:
        return [self.get_data_points_helper()]
