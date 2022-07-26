from datetime import datetime, timedelta, timezone
import time

from producers import PRODUCER_CLS_MAP

tick_length = timedelta(seconds=5)


PRODUCER_MAP = {
    k: producer_cls(tick_length) for k, producer_cls in PRODUCER_CLS_MAP.items()
}
PRODUCERS = PRODUCER_MAP.values()


def run():
    while True:
        print("Tick")

        current_time = datetime.now(timezone.utc)

        for k, producer in PRODUCER_MAP.items():
            if not producer.should_emit(current_time):
                continue
            data_points = producer.get_data_points(current_time)
            if data_points:
                print(f'Producer {k} emitted {len(data_points)} data points.')
            else:
                continue
            print(data_points)

        time.sleep(tick_length.total_seconds())


if __name__ == "__main__":
    run()