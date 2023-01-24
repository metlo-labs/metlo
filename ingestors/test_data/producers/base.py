from typing import List
from datetime import datetime, timedelta
from random import random
from faker import Faker
from faker.providers import internet


class BaseProducer:

    avg_emit_delta = timedelta(minutes=5)

    def __init__(self, tick_length: timedelta):
        self.tick_length = tick_length
        self.fake = Faker()
        self.fake.add_provider(internet)

    def get_fake_phonenum(self):
        out = self.fake.phone_number()
        if 'x' in out:
            return out.split('x')[0]
        return out

    def should_emit(self, time: datetime) -> bool:
        emit_probability = self.tick_length / self.avg_emit_delta
        return random() < emit_probability

    def get_data_point(self, time: datetime) -> dict:
        raise NotImplementedError()

    def get_data_points(self, time: datetime) -> List[dict]:
        return [self.get_data_point(time)]
