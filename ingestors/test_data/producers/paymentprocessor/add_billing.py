from datetime import timedelta
from uuid import uuid4
import json

from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer


class PaymentProcessorAddBillingProducer(BaseProducer):

    avg_emit_delta = timedelta(minutes=5)

    def get_data_point(self, time) -> dict:
        user_uuid = str(uuid4())
        resp_body = {
            "success": True,
            "msg": "Added Billing to User...",
        }
        req_body = {
            "ccn": self.fake.credit_card_number(),
            "cc_exp": self.fake.credit_card_expire(),
            "cc_code": self.fake.credit_card_security_code(),
            "address": self.fake.address(),
        }
        return {
            "request": {
                "url": {
                    "host": "test-payment-processor.metlo.com",
                    "path": f"/user/{user_uuid}/billing",
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
