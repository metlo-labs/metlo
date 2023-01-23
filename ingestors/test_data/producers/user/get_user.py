from datetime import timedelta
from uuid import uuid4
import json

from producers.paymentprocessor.utils import destinations as payment_hosts
from producers.ecommerce.utils import destinations as ecommerce_hosts
from producers.user.utils import destinations as user_hosts
from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer


class UserServiceGetUserProducer(BaseProducer):

    avg_emit_delta = timedelta(seconds=20)

    def get_data_point(self, time) -> dict:
        user_uuid = str(uuid4())
        req_body = {
            "user_uuid": user_uuid,
        }
        resp_body = {
            "user_uuid": user_uuid,
            "name": self.fake.first_name(),
            "email": self.fake.free_email(),
            "address": self.fake.address(),
            "phoneNumber": self.get_fake_phonenum(),
        }
        return {
            "request": {
                "url": {
                    "host": "test-user-service.metlo.com",
                    "path": "/user",
                    "parameters": []
                },
                "headers": [get_auth_header()],
                "method": "GET",
                "body": json.dumps(req_body),
            },
            "response": {
                "status": 200,
                "headers": [JSON_HEADER],
                "body": json.dumps(resp_body),
            },
            "meta": get_meta(ecommerce_hosts + payment_hosts, user_hosts),
        }
