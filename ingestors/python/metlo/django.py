import json
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen

from django.conf import settings


class MetloDjango(object):

    def perform_request(self, data):
        urlopen(
            url=self.saved_request,
            data=json.dumps(data).encode('utf-8')
        )

    def __init__(self, get_response):
        """
        Middleware for Django to communicate with METLO
        :param get_response: Automatically populated by django
        """
        self.get_response = get_response
        self.pool = ThreadPoolExecutor(max_workers=settings.METLO_CONFIG.get("workers", 4))

        assert settings.METLO_CONFIG.get("METLO_HOST") is not None, "METLO_CONFIG is missing METLO_HOST attribute"
        assert settings.METLO_CONFIG.get("API_KEY") is not None, "METLO_CONFIG is missing API_KEY attribute"

        self.host = settings.METLO_CONFIG["METLO_HOST"]
        self.key = settings.METLO_CONFIG["API_KEY"]
        self.saved_request = Request(
            url=self.host,
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": self.key,
            },
            method="POST"
        )

    def __call__(self, request):
        response = self.get_response(request)
        params = request.GET if request.method == "GET" else request.POST
        dest_ip = request.META.get("SERVER_NAME") if \
            "1.0.0.127.in-addr.arpa" not in request.META.get("SERVER_NAME") else "localhost"
        src_ip = request.META.get("REMOTE_ADDR") if \
            "1.0.0.127.in-addr.arpa" not in request.META.get("REMOTE_ADDR") else "localhost"
        source_port = request.environ["wsgi.input"].stream.raw._sock.getpeername()[1]
        res_body = response.content.decode("utf-8")
        data = {
            "request": {
                "url": {
                    "host": request._current_scheme_host if request._current_scheme_host else src_ip,
                    "path": request.path,
                    "parameters": list(map(lambda x: {"name": x[0], "value": x[1]}, params.items())),
                },
                "headers": list(map(lambda x: {"name": x[0], "value": x[1]}, request.headers.items())),
                "body": request.body.decode("utf-8"),
                "method": request.method,
            },
            "response": {
                "url": f"{dest_ip}:{request.META.get('SERVER_PORT')}",
                "status": response.status_code,
                "headers": list(map(lambda x: {"name": x[0], "value": x[1]}, response.headers.items())),
                "body": res_body,
            },
            "meta": {
                "environment": "production",
                "incoming": True,
                "source": src_ip,
                "sourcePort": source_port,
                "destination": dest_ip,
                "destinationPort": request.META.get('SERVER_PORT'),
            }
        }
        self.pool.submit(self.perform_request, data=data)
        return response

    def process_exception(self, request, exception):
        return None
