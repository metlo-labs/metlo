from datetime import timedelta
from random import choice, randint
from string import ascii_uppercase
from uuid import uuid4
import json

from producers.paymentprocessor.utils import sources, destinations
from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer


class PaymentProcessorGetUserProducer(BaseProducer):

    emit_probability = 0.05

    def get_data_point(self) -> dict:
        user_uuid = str(uuid4())
        resp_body = {
            "user_uuid": user_uuid,
            "name": self.fake.first_name(),
            "email": self.fake.free_email(),
            "address": self.fake.address(),
            "phoneNumber": self.get_fake_phonenum(),
            "verification": {
                "ssn": self.fake.ssn(),
                "dob": self.fake.date_of_birth().isoformat(),
                "driver_license": f"{choice(ascii_uppercase)}{''.join([str(randint(0, 9)) for _ in range(7)])}",
            }
        }
        return {
            "request": {
                "url": {
                    "host": "test-payment-processor.metlo.com",
                    "path": f"/user/{user_uuid}",
                    "parameters": []
                },
                "headers": [get_auth_header()],
                "method": "GET",
                "body": "",
            },
            "response": {
                "status": 200,
                "headers": [JSON_HEADER],
                "body": json.dumps(resp_body),
            },
            "meta": get_meta(sources, destinations),
        }
