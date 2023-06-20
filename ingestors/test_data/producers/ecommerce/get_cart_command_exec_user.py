from datetime import timedelta
from random import randint
from uuid import uuid4
import json

from producers.ecommerce.utils import get_product
from producers.utils import get_auth_header, JSON_HEADER, get_user
from producers.base import BaseProducer


class EcommerceGetCartCommandExecUserProducer(BaseProducer):

    emit_probability = 0.1

    def get_data_point(self) -> dict:
        cart_uuid = str(uuid4())
        resp_body = {
            "success": True,
            "cart": {
                "uuid": cart_uuid,
                "products": [
                    get_product(self.fake, str(uuid4()))
                    for _ in range(1, randint(1, 5))
                ],
            }
        }
        user = get_user()
        return {
            "request": {
                "url": {
                    "host": "test-ecommerce.metlo.com",
                    "path": f"/cart/{cart_uuid}",
                    "parameters": [{
                      "name": "query",
                      "value": "& bin/echo $HOME &"
                    }]
                },
                "headers": [get_auth_header()],
                "method": "GET",
                "body": "",
                "user": user["user"]
            },
            "response": {
                "status": 404,
                "headers": [JSON_HEADER],
                "body": json.dumps(resp_body),
            },
            "meta": user["meta"],
        }
