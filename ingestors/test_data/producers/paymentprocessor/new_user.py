from datetime import timedelta
from uuid import uuid4
import json

from producers.paymentprocessor.utils import sources, destinations
from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer


class PaymentProcessorUserProducer(BaseProducer):

    emit_probability = 0.05

    def get_data_point(self) -> dict:
        resp_body = {
            "user_uuid": str(uuid4()),
            "success": True,
            "msg": "Created a new user...",
        }
        req_body = {
            "name": self.fake.first_name(),
            "email": self.fake.free_email(),
            "address": self.fake.address(),
            "phoneNumber": self.get_fake_phonenum(),
        }
        return {
            "request": {
                "url": {
                    "host": "test-payment-processor.metlo.com",
                    "path": "/user",
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
