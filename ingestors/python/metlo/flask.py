import json
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen

from flask import request


class MetloFlask:
    def perform_request(self, data):
        urlopen(
            url=self.saved_request,
            data=json.dumps(data).encode('utf-8')
        )

    def __init__(self, app, metlo_host: str, metlo_api_key: str, **kwargs):
        """
        :param app: Instance of Flask app
        :param metlo_host: Publicly accessible address of Metlo Collector
        :param metlo_api_key: Metlo API Key
        :param kwargs: optional parameter containing worker count for communicating with metlo
        """
        self.app = app
        self.pool = ThreadPoolExecutor(max_workers=kwargs.get("workers", 4))

        assert metlo_host is not None, "METLO for FLASK __init__ is missing metlo_host parameter"
        assert metlo_api_key is not None, "METLO for FLASK __init__ is missing metlo_api_key parameter"

        self.host = metlo_host
        self.key = metlo_api_key
        self.saved_request = Request(
            url=self.host,
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": self.key,
            },
            method="POST"
        )

        @app.after_request
        def function(response, *args, **kwargs):
            dst_host = request.environ.get("HTTP_HOST") or request.environ.get(
                "HTTP_X_FORWARDED_FOR") or request.environ.get("REMOTE_ADDR")
            data = {
                "request": {
                    "url": {
                        "host": dst_host,
                        "path": request.path,
                        "parameters": list(map(lambda x: {"name": x[0], "value": x[1]}, request.args.items())),
                    },
                    "headers": list(map(lambda x: {"name": x[0], "value": x[1]}, (request.headers).items())),
                    "body": request.data.decode("utf-8"),
                    "method": request.method,
                },
                "response": {
                    "url": f"{request.environ.get('SERVER_NAME')}:{request.environ.get('SERVER_PORT')}",
                    "status": response.status_code,
                    "headers": list(map(lambda x: {"name": x[0], "value": x[1]}, (response.headers).items())),
                    "body": response.data.decode("utf-8"),
                },
                "meta": {
                    "environment": "production",
                    "incoming": True,
                    "source": request.environ.get("HTTP_X_FORWARDED_FOR") or request.environ.get("REMOTE_ADDR"),
                    "sourcePort": request.environ.get("REMOTE_PORT"),
                    "destination": request.environ.get("SERVER_NAME"),
                    "destinationPort": request.environ.get('SERVER_PORT'),
                }
            }
            self.pool.submit(self.perform_request, data=data)
            return response
