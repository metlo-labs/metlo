from datetime import datetime, timedelta
from typing import List
from uuid import uuid4
import json
from random import choices, choice
from faker import Faker
from faker.providers import internet

fake = Faker()
fake.add_provider(internet)


from producers.base import BaseProducer


class EcommerceMakePurchaseProducer(BaseProducer):

    avg_emit_delta = timedelta(seconds=5)

    def get_data_points_helper(self) -> dict:
        cart_uuid = str(uuid4())
        responses = [
            {
                "status": 200,
                "headers": [
                    {
                        "name": "content-type",
                        "value": "application/json; charset=utf-8",
                    },
                ],
                "body": json.dumps({
                    "ok": True,
                    "msg": "Completed Purchase."
                }),
            },
            {
                "status": 500,
                "headers": [
                    {
                        "name": "content-type",
                        "value": "application/json; charset=utf-8",
                    },
                ],
                "body": json.dumps({
                    "ok": False,
                    "msg": "Failed to completed purchase."
                }),
            }
        ]
        req_body = {
            "cart_uuid": cart_uuid,
            "name": fake.name(),
            "ccn": fake.credit_card_number(),
            "cc_exp": fake.credit_card_expire(),
            "cc_code": fake.credit_card_security_code(),
        }
        return {
            "request": {
                "url": {
                    "host": "test-ecommerce.metlo.com",
                    "path": f"/cart/{cart_uuid}/purchase",
                    "parameters": []
                },
                "method": "POST",
                "body": json.dumps(req_body),
            },
            "response": choices(responses, [5, 1], k=1)[0], 
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
