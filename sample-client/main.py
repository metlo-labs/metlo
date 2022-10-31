import argparse
import time
import os
import requests
import concurrent.futures
from datetime import datetime, timedelta, timezone
from urllib.parse import urljoin
from dotenv import load_dotenv

from producers.ecommerce.utils import get_products, get_carts

from producers import PRODUCER_CLS_MAP


load_dotenv()

tick_length = timedelta(seconds=1)


PRODUCER_MAP = {
    k: producer_cls(tick_length) for k, producer_cls in PRODUCER_CLS_MAP.items()
}
PRODUCERS = PRODUCER_MAP.values()

def execute_request(point, backend, api_key):
    path = point["path"]
    url = urljoin(backend, path)
    headers = {"x-api-key": api_key} if point["header"] else {}
    try:
        if point["method"] == "post":
            print
            body = point["body"]
            r = requests.post(
                url, json=body, headers=headers
            )
            r.raise_for_status()
        elif point["method"] == "get":
            params = point["params"]
            r = requests.get(
                url, params=params, headers=headers
            )
            r.raise_for_status()
    except requests.exceptions.HTTPError as err:
        pass

def run(backend, api_key, rps):
    while True:
        print("Tick")

        current_time = datetime.now(timezone.utc)
        products = get_products(backend, api_key)
        carts = get_carts(backend, api_key)

        for k, producer in PRODUCER_MAP.items():
            if not producer.should_emit(current_time):
                continue
            data_points = producer.get_data_points(current_time, products, carts, rps)
            if data_points:
                print(f"Producer {k} emitted {len(data_points)} data points.")
            if not data_points:
                continue
            with concurrent.futures.ThreadPoolExecutor() as executor:
                futures = []
                for point in data_points:
                    futures.append(executor.submit(execute_request, point=point, backend=backend, api_key=api_key))

        time.sleep(tick_length.total_seconds())

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-b", "--metlo_backend", required=True)
    parser.add_argument("-key", "--api_key", required=True)
    parser.add_argument("-r", "--rps", required=True)
    args = parser.parse_args()
    metlo_backend = args.metlo_backend
    api_key = args.api_key
    rps = int(args.rps)
    run(metlo_backend, api_key, rps)
