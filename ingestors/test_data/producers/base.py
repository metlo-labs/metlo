from typing import List
from datetime import datetime, timedelta
from random import random
from faker import Faker
from faker.providers import internet


class BaseProducer:
    
    emit_probability = 0.2

    def __init__(self):
        self.fake = Faker()
        self.fake.add_provider(internet)

    def get_fake_phonenum(self):
        out = self.fake.phone_number()
        if 'x' in out:
            return out.split('x')[0]
        return out

    def should_emit(self) -> bool:
        return random() < self.emit_probability

    def get_data_point(self) -> dict:
        raise NotImplementedError()

    def get_data_points(self) -> List[dict]:
        return [self.get_data_point()]
