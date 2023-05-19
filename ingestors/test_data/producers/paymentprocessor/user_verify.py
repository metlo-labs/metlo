from datetime import timedelta
from uuid import uuid4
from string import ascii_uppercase
from random import choice, randint
import json

from producers.paymentprocessor.utils import sources, destinations
from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer


class PaymentProcessorUserVerifyProducer(BaseProducer):

    emit_probability = 0.05

    def get_data_point(self) -> dict:
        resp_body = {
            "success": True,
            "msg": "Verified User...",
        }
        req_body = {
            "ssn": self.fake.ssn(),
            "dob": self.fake.date_of_birth().isoformat(),
            "driver_license": f"{choice(ascii_uppercase)}{''.join([str(randint(0, 9)) for _ in range(7)])}",
        }
        return {
            "request": {
                "url": {
                    "host": "test-payment-processor.metlo.com",
                    "path": f"/user/{uuid4()}/verify",
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
