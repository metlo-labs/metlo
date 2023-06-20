from datetime import timedelta
from uuid import uuid4
import json

from producers.ecommerce.utils import get_product
from producers.utils import JSON_HEADER, get_user
from producers.base import BaseProducer


class EcommerceGetProductSSRFUserProducer(BaseProducer):
    emit_probability = 0.1

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
                },
            },
        }
        user = get_user()
        return {
            "request": {
                "url": {
                    "host": "test-ecommerce.metlo.com",
                    "path": f"/product/{product_uuid}",
                    "parameters": [
                        {
                            "name": "query",
                            "value": "http://169.254.169.254/metadata/v1/",
                        }
                    ],
                },
                "headers": [],
                "method": "GET",
                "body": "",
                "user": user["user"],
            },
            "response": {
                "status": 200,
                "headers": [JSON_HEADER],
                "body": json.dumps(resp_body),
            },
            "meta": user["meta"],
        }
