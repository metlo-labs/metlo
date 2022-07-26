from typing import List
from datetime import datetime, timedelta
from random import random


class BaseProducer:

    avg_emit_delta = timedelta(minutes=5)

    def __init__(self, tick_length: timedelta):
        self.tick_length = tick_length

    def should_emit(self, time: datetime) -> bool:
        emit_probability = self.tick_length / self.avg_emit_delta
        return random() < emit_probability

    def get_data_point(self, time: datetime) -> dict:
        raise NotImplementedError()

    def get_data_points(self, time: datetime) -> List[dict]:
        return [self.get_data_point(time)]
