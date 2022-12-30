from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen
import logging
import json

from .utils.patcher import Patcher

endpoint = "api/v1/log-request/single"


class Framework(object):
    def perform_request(self, data):
        try:
            urlopen(url=self.saved_request, data=json.dumps(data).encode("utf-8"))
        except Exception as e:
            self.logger.warn(e)

    def __init__(self, metlo_host: str, metlo_api_key: str, **kwargs):
        self.logger = logging.getLogger("metlo")
        self.host = metlo_host
        self.key = metlo_api_key
        self.num_workers = kwargs.get("workers", 4)
        self.disabled = kwargs.get("disabled", False)
        self.pool = ThreadPoolExecutor(max_workers=self.num_workers)

        self.host += endpoint if self.host[-1] == "/" else f"/{endpoint}"
        self.saved_request = Request(
            url=self.host,
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": self.key,
            },
            method="POST",
        )
        Patcher(**kwargs)
