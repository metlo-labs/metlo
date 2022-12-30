from urllib.parse import urlparse
from time import perf_counter

from flask import request

from .framework import Framework
from .utils.request_context import request_context, ctx_store


class MetloFlask(Framework):
    def __init__(self, app, metlo_host: str, metlo_api_key: str, **kwargs):
        """
        :param app: Instance of Flask app
        :param metlo_host: Publicly accessible address of Metlo Collector
        :param metlo_api_key: Metlo API Key
        :param kwargs: optional parameter containing worker count for communicating with metlo
        """
        self.app = app

        assert (
            metlo_host is not None
        ), "Metlo for FLASK __init__ is missing metlo_host parameter"
        assert (
            metlo_api_key is not None
        ), "Metlo for FLASK __init__ is missing metlo_api_key parameter"
        assert urlparse(metlo_host).scheme in [
            "http",
            "https",
        ], f"Metlo for FLASK has invalid host scheme. Host must be in format http[s]://example.com"

        super(MetloFlask, self).__init__(metlo_host, metlo_api_key, **kwargs)

        if not self.disabled:

            @app.before_request
            def function():
                request_context.init_at_request()
                ctx_store.start_time = perf_counter()

            @app.after_request
            def function(response, *args, **kwargs):
                try:
                    response_time = perf_counter() - ctx_store.start_time
                    response_time_ms = int(response_time * 1000)
                    routerPath = request.url_rule.rule.replace("<", "{").replace(
                        ">", "}"
                    )
                    dst_host = (
                        request.environ.get("HTTP_HOST")
                        or request.environ.get("HTTP_X_FORWARDED_FOR")
                        or request.environ.get("REMOTE_ADDR")
                    )
                    files_accessed = ctx_store.get("files_accessed", [])
                    db_queries = ctx_store.get("db_queries", [])
                    requests_data = ctx_store.get("requests", [])
                    system_commands = ctx_store.get("system_commands", [])
                    data = {
                        "responseTime": response_time_ms,
                        "request": {
                            "url": {
                                "host": dst_host,
                                "path": request.path,
                                "parameters": list(
                                    map(
                                        lambda x: {"name": x[0], "value": x[1]},
                                        request.args.items(),
                                    )
                                ),
                            },
                            "headers": list(
                                map(
                                    lambda x: {"name": x[0], "value": x[1]},
                                    (request.headers).items(),
                                )
                            ),
                            "routerPath": routerPath,
                            "body": request.data.decode("utf-8"),
                            "method": request.method,
                        },
                        "response": {
                            "url": f"{request.environ.get('SERVER_NAME')}:{request.environ.get('SERVER_PORT')}",
                            "status": response.status_code,
                            "headers": list(
                                map(
                                    lambda x: {"name": x[0], "value": x[1]},
                                    (response.headers).items(),
                                )
                            ),
                            "body": response.data.decode("utf-8"),
                        },
                        "meta": {
                            "environment": "production",
                            "incoming": True,
                            "source": request.environ.get("HTTP_X_FORWARDED_FOR")
                            or request.environ.get("REMOTE_ADDR"),
                            "sourcePort": request.environ.get("REMOTE_PORT"),
                            "destination": request.environ.get("SERVER_NAME"),
                            "destinationPort": request.environ.get("SERVER_PORT"),
                            "metloSource": "python/flask",
                        },
                        "fileAccess": files_accessed,
                        "dbQueries": db_queries,
                        "requests": requests_data,
                        "systemCommands": system_commands,
                    }
                    self.pool.submit(self.perform_request, data=data)
                except Exception as e:
                    self.logger.debug(e)
                return response
