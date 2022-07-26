import argparse
from datetime import datetime, timedelta, timezone
from urllib.parse import urljoin
import time

import requests

from producers import PRODUCER_CLS_MAP


tick_length = timedelta(seconds=5)


PRODUCER_MAP = {
    k: producer_cls(tick_length) for k, producer_cls in PRODUCER_CLS_MAP.items()
}
PRODUCERS = PRODUCER_MAP.values()


def run(backend):
    while True:
        print("Tick")

        current_time = datetime.now(timezone.utc)

        for k, producer in PRODUCER_MAP.items():
            if not producer.should_emit(current_time):
                continue
            data_points = producer.get_data_points(current_time)
            if data_points:
                print(f'Producer {k} emitted {len(data_points)} data points.')
            if not data_points:
                continue
            path = '/log-request/single' if len(data_points) == 1 else '/log-request/batch'
            body = data_points[0] if len(data_points) == 1 else data_points
            requests.post(urljoin(backend, path), json=body)

        time.sleep(tick_length.total_seconds())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('-b', '--metlo_backend', required=True)
    args = parser.parse_args()
    run(args.metlo_backend)
