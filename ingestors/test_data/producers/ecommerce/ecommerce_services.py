from typing import List
from uuid import uuid4
import json
from random import choice

from producers.ecommerce.utils import sources, destinations
from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer
from producers.ecommerce.services import ALL_SUBCLASSESS


class EcommerceServicesProducer(BaseProducer):
    emit_probability = 0.8

    def get_data_point(self) -> dict:
        random_service = choice(ALL_SUBCLASSESS)()
        service_info = random_service.get_info(str(uuid4()), str(uuid4()))

        resp = {
            "status": 200,
            "headers": [JSON_HEADER],
            "body": json.dumps(service_info[2]),
        }
        return {
            "request": {
                "url": {
                    "host": "test-ecommerce.metlo.com",
                    "path": service_info[0],
                    "parameters": [],
                },
                "headers": [get_auth_header()],
                "method": choice(service_info[1]),
            },
            "response": resp,
            "meta": get_meta(sources, destinations),
        }
