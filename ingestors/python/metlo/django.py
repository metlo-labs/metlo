import json
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen
from urllib.parse import urlparse
import logging

from django.conf import settings

endpoint = "api/v1/log-request/single"


class MetloDjango(object):
    def perform_request(self, data):
        try:
            urlopen(url=self.saved_request, data=json.dumps(data).encode("utf-8"))
        except Exception as e:
            self.logger.warning(e)

    def __init__(self, get_response):
        """
        Middleware for Django to communicate with METLO
        :param get_response: Automatically populated by django
        """
        self.get_response = get_response
        self.logger = logging.getLogger("metlo")
        ch = logging.StreamHandler()
        ch.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(process)d] [%(levelname)s] [%(name)s]  %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S %z",
        )
        ch.setFormatter(formatter)
        self.logger.addHandler(ch)
        self.pool = ThreadPoolExecutor(
            max_workers=settings.METLO_CONFIG.get("workers", 4)
        )

        self.disabled = settings.METLO_CONFIG.get("DISABLED", False)

        assert (
            settings.METLO_CONFIG.get("METLO_HOST") is not None
        ), "METLO_CONFIG is missing METLO_HOST attribute"
        assert (
            settings.METLO_CONFIG.get("API_KEY") is not None
        ), "METLO_CONFIG is missing API_KEY attribute"
        assert urlparse(settings.METLO_CONFIG.get("METLO_HOST")).scheme in [
            "http",
            "https",
        ], f"Metlo for Django has invalid host scheme. Host must be in format http[s]://example.com"

        self.host = settings.METLO_CONFIG["METLO_HOST"]
        self.host += endpoint if self.host[-1] == "/" else f"/{endpoint}"
        self.key = settings.METLO_CONFIG["API_KEY"]
        self.saved_request = Request(
            url=self.host,
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": self.key,
            },
            method="POST",
        )

    def __call__(self, request):
        response = self.get_response(request)
        if not self.disabled:
            try:
                params = request.GET if request.method == "GET" else request.POST
                dest_ip = (
                    request.META.get("SERVER_NAME")
                    if "1.0.0.127.in-addr.arpa" not in request.META.get("SERVER_NAME")
                    else "localhost"
                )
                src_ip = (
                    request.META.get("REMOTE_ADDR")
                    if "1.0.0.127.in-addr.arpa" not in request.META.get("REMOTE_ADDR")
                    else "localhost"
                )
                source_port = None
                try:
                    source_port = request.environ[
                        "wsgi.input"
                    ].stream.raw._sock.getpeername()[1]
                except:
                    source_port = request.META.get("REMOTE_PORT")
                res_body = response.content.decode("utf-8")
                data = {
                    "request": {
                        "url": {
                            "host": request._current_scheme_host
                            if request._current_scheme_host
                            else src_ip,
                            "path": request.path,
                            "parameters": list(
                                map(
                                    lambda x: {"name": x[0], "value": x[1]},
                                    params.items(),
                                )
                            ),
                        },
                        "headers": list(
                            map(
                                lambda x: {"name": x[0], "value": x[1]},
                                request.headers.items(),
                            )
                        ),
                        "body": request.body.decode("utf-8"),
                        "method": request.method,
                    },
                    "response": {
                        "url": f"{dest_ip}:{request.META.get('SERVER_PORT')}",
                        "status": response.status_code,
                        "headers": list(
                            map(
                                lambda x: {"name": x[0], "value": x[1]},
                                response.headers.items(),
                            )
                        ),
                        "body": res_body,
                    },
                    "meta": {
                        "environment": "production",
                        "incoming": True,
                        "source": src_ip,
                        "sourcePort": source_port,
                        "destination": dest_ip,
                        "destinationPort": request.META.get("SERVER_PORT"),
                        "metloSource": "python/django",
                    },
                }
                self.pool.submit(self.perform_request, data=data)
            except Exception as e:
                self.logger.debug(e)
        return response

    def process_exception(self, request, exception):
        return None
