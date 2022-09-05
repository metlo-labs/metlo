from datetime import timedelta
from uuid import uuid4
import json
from random import randint

from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer


class PaymentProcessorAddChargeProducer(BaseProducer):

    avg_emit_delta = timedelta(seconds=20)

    def get_data_point(self, time) -> dict:
        resp_body = {
            "success": True,
            "msg": "Created Charge...",
        }
        req_body = {
            "price": randint(50, 10000),
            "user_uuid": str(uuid4()),
            "billing_uuid": str(uuid4()),
        }
        return {
            "request": {
                "url": {
                    "host": "test-payment-processor.metlo.com",
                    "path": "/charge",
                    "parameters": []
                },
                "headers": [get_auth_header()],
                "method": "POST",
                "body": json.dumps(req_body),
            },
            "response": {
                "status": 200,
                "headers": [JSON_HEADER],
                "body": json.dumps(resp_body),
            },
            "meta": get_meta(),
        }
