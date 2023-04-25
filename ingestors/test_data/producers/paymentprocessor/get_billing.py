from datetime import timedelta
from uuid import uuid4
import json

from producers.paymentprocessor.utils import sources, destinations
from producers.utils import get_meta, JSON_HEADER
from producers.base import BaseProducer


class PaymentProcessorGetBillingProducer(BaseProducer):

    emit_probability = 0.1

    def get_data_point(self) -> dict:
        user_uuid = str(uuid4())
        billing_uuid = str(uuid4())
        resp_body = {
            "uuid": billing_uuid,
            "user_uuid": user_uuid,
            "ccn": self.fake.credit_card_number(),
            "cc_exp": self.fake.credit_card_expire(),
            "cc_code": self.fake.credit_card_security_code(),
            "address": self.fake.address(),
        }
        return {
            "request": {
                "url": {
                    "host": "test-payment-processor.metlo.com",
                    "path": f"/user/{user_uuid}/billing/{billing_uuid}",
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
