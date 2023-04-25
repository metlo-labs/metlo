from datetime import timedelta
from uuid import uuid4
import json

from producers.ecommerce.utils import sources, destinations
from producers.utils import get_meta, JSON_HEADER
from producers.base import BaseProducer


class EcommerceRegisterProducer(BaseProducer):

    emit_probability = 0.005

    def get_data_point(self) -> dict:
        resp_body = {
            "success": True,
            "msg": "Created a new user...",
            "user_uuid": str(uuid4()),
            "api_key": str(uuid4()),
        }
        req_body = {
            "name": self.fake.first_name(),
            "email": self.fake.free_email(),
            "address": self.fake.address(),
            "phoneNumber": self.get_fake_phonenum(),
            "dob": self.fake.date_of_birth().isoformat(),
            "password": self.fake.sentence(nb_words=5),
        }
        return {
            "request": {
                "url": {
                    "host": "test-ecommerce.metlo.com",
                    "path": "/register",
                    "parameters": []
                },
                "headers": [],
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
