from datetime import timedelta
from uuid import uuid4
import json

from producers.ecommerce.utils import get_product, sources, destinations
from producers.utils import get_meta, JSON_HEADER
from producers.base import BaseProducer


class EcommerceGetProductProducer(BaseProducer):

    emit_probability = 0.9

    def get_data_point(self) -> dict:
        product_uuid = str(uuid4())
        resp_body = {
            "success": True,
            "product": {
                **get_product(self.fake, product_uuid),
                "owner": {
                    "user_uuid": str(uuid4()),
                    "name": self.fake.first_name(),
                    "email": self.fake.free_email(),
                    "address": self.fake.address(),
                    "phoneNumber": self.get_fake_phonenum(),
                    "dob": self.fake.date_of_birth().isoformat(),
                    "password": self.fake.sentence(nb_words=5),
                }
            }
        }
        return {
            "request": {
                "url": {
                    "host": "test-ecommerce.metlo.com",
                    "path": f"/product/{product_uuid}",
                    "parameters": []
                },
                "headers": [],
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
