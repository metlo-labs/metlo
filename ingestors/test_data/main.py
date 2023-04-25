import argparse
from collections import defaultdict
from datetime import datetime, timedelta, timezone
import time
import grpc

from yaspin import yaspin

from producers import PRODUCER_CLS_MAP
import metloingest_pb2_grpc as mi
import metloingest_pb2 as mi_types


tick_length = timedelta(seconds=5)


PRODUCER_MAP = {
    k: producer_cls() for k, producer_cls in PRODUCER_CLS_MAP.items()
}
PRODUCERS = PRODUCER_MAP.values()


def map_key_val(ls):
    return [
        mi_types.KeyVal(name=e["name"], value=e["value"])
        for e in ls
    ]


def req_iter():
    while True:
        for k, producer in PRODUCER_MAP.items():
            if not producer.should_emit():
                continue
            data_points = producer.get_data_points()
            if not data_points:
                continue
            for point in data_points:
                yield mi_types.ApiTrace(
                    meta=mi_types.ApiMeta(
                        environment=point["meta"]["environment"],
                        incoming=point["meta"]["incoming"],
                        source=point["meta"]["source"],
                        source_port=point["meta"]["sourcePort"],
                        destination=point["meta"]["destination"],
                        destination_port=point["meta"]["destinationPort"],
                    ),
                    request=mi_types.ApiRequest(
                        method=point["request"]["method"],
                        url=mi_types.ApiUrl(
                            host=point["request"]["url"]["host"],
                            path=point["request"]["url"]["path"],
                            parameters=map_key_val(point["request"]["url"]["parameters"]),
                        ),
                        headers=map_key_val(point["request"]["headers"]),
                        body=(point["request"]["body"] if "body" in point["request"] else None),
                    ),
                    response=mi_types.ApiResponse(
                        status=point["response"]["status"],
                        headers=map_key_val(point["response"]["headers"]),
                        body=(point["response"]["body"] if "body" in point["response"] else None),
                    ),
                )



def req_iter_rps(rps):
    reqs = req_iter()
    sent_req_map = defaultdict(int)
    with yaspin(text="Sending Test Data", color="cyan") as sp:
        while True:
            try:
                start = time.time()
                a = next(reqs)
                yield a
                current_time = datetime.now(timezone.utc)
                curr_time_key = current_time.isoformat()[:19]
                sent_req_map[curr_time_key] += 1
                keep_keys = set(sorted(sent_req_map.keys())[-10:])
                sent_req_map = defaultdict(int, { k: v for k, v in sent_req_map.items() if k in keep_keys})
                if len(sent_req_map) > 1:
                    measure_keys = set(sorted(sent_req_map.keys())[:-1])
                    real_rps = sum([ v for k, v in sent_req_map.items() if k in measure_keys ]) / len(measure_keys)
                else:
                    real_rps = 0
                sp.text = f"Sending Test Data: {real_rps:.2f} rps"
                time.sleep(max((1 / rps) - (time.time() - start), 0))
            except Exception as e:
                print(e)
                return


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-s", "--rps", type=int, default=1)
    args = parser.parse_args()
    with grpc.insecure_channel('unix:///tmp/metlo.sock') as channel:
        stub = mi.MetloIngestStub(channel)
        stub.ProcessTraceAsync(req_iter_rps(args.rps))
