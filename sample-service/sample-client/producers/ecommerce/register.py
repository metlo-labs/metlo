from datetime import datetime, timedelta
from typing import List

from producers.base import BaseProducer


class EcommerceRegisterProducer(BaseProducer):

    avg_emit_delta = timedelta(minutes=10)

    def get_data_points_helper(self) -> dict:
        req_body = {
            "firstName": self.fake.first_name(),
            "lastName": self.fake.first_name(),
            "email": self.fake.free_email(),
            "address": self.fake.address(),
            "phoneNumber": self.fake.phone_number(),
            "dob": self.fake.date_of_birth().isoformat(),
            "password": self.fake.sentence(nb_words=5),
        }
        return {
            "method": "post",
            "path": "/register",
            "body": req_body,
            "header": False
        }

    def get_data_points(self, time: datetime, products=None, carts=None, rps=8) -> List[dict]:
        return [self.get_data_points_helper() for _ in range(8)]
