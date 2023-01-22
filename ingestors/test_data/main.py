import argparse
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from urllib.parse import urljoin
import time

import requests
from yaspin import yaspin

from producers import PRODUCER_CLS_MAP


tick_length = timedelta(seconds=5)


PRODUCER_MAP = {
    k: producer_cls(tick_length) for k, producer_cls in PRODUCER_CLS_MAP.items()
}
PRODUCERS = PRODUCER_MAP.values()


def run(backend, api_key, speed_multiple):
    sent_req_map = defaultdict(int)
    with yaspin(text="Sending Test Data", color="cyan") as sp:
        while True:
            current_time = datetime.now(timezone.utc)
            curr_time_key = current_time.isoformat()[:16]
            for k, producer in PRODUCER_MAP.items():
                if not producer.should_emit(current_time):
                    continue
                data_points = producer.get_data_points(current_time)
                sent_req_map[curr_time_key] += len(data_points)
                if not data_points:
                    continue
                path = (
                    "/api/v1/log-request/single"
                    if len(data_points) == 1
                    else "/api/v1/log-request/batch"
                )
                body = data_points[0] if len(data_points) == 1 else data_points
                try:
                    requests.post(
                        urljoin(backend, path), json=body, headers={"authorization": api_key}
                    )
                except Exception as e:
                    sp.write(f"Error: {e}... Sleeping for 5 seconds")
                    time.sleep(5)
            keep_keys = set(sorted(sent_req_map.keys())[-60:])
            sent_req_map = defaultdict(int, { k: v for k, v in sent_req_map.items() if k in keep_keys})

            if len(sent_req_map) > 0:
                rpm = sum(sent_req_map.values()) / len(sent_req_map)
            else:
                rpm = 0

            sp.text = f"Sending Test Data: {rpm:.2f} rpm"
            time.sleep(tick_length.total_seconds() / speed_multiple)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-b", "--metlo_backend", required=True)
    parser.add_argument("-key", "--api_key", required=True)
    parser.add_argument("-s", "--speed_multiple", type=int, default=1)
    args = parser.parse_args()
    run(args.metlo_backend, args.api_key, args.speed_multiple)
