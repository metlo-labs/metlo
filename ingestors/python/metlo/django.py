from urllib.parse import urlparse
from time import perf_counter

from django.conf import settings

from .framework import Framework
from .utils.request_context import request_context, ctx_store


class MetloDjango(Framework):
    def __init__(self, get_response):
        """
        Middleware for Django to communicate with METLO
        :param get_response: Automatically populated by django
        """
        self.get_response = get_response

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

        settings_args = {
            "workers": settings.METLO_CONFIG.get("workers"),
            "disabled": settings.METLO_CONFIG.get("DISABLED"),
            "file_inclusion_enabled": settings.METLO_CONFIG.get("FILE_INCLUSION_ENABLED", True),
            "db_logging_enabled": settings.METLO_CONFIG.get("DB_LOGGING_ENABLED", True)
        }
        super(MetloDjango, self).__init__(
            settings.METLO_CONFIG["METLO_HOST"],
            settings.METLO_CONFIG["API_KEY"],
            **settings_args,
        )

    def __call__(self, request):
        request_context.init_at_request()
        start = perf_counter()
        response = self.get_response(request)
        if not self.disabled:
            try:
                response_time = perf_counter() - start
                response_time_ms = int(response_time * 1000)
                files_accessed = ctx_store.get("files_accessed", [])
                db_queries = ctx_store.get("db_queries", [])
                requests_data = ctx_store.get("requests", [])
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
                source_port = request.environ[
                    "wsgi.input"
                ].stream.raw._sock.getpeername()[1]
                res_body = response.content.decode("utf-8")
                data = {
                    "responseTime": response_time_ms,
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
                    "fileAccess": files_accessed,
                    "dbQueries": db_queries,
                    "requests": requests_data,
                }
                self.pool.submit(self.perform_request, data=data)
            except Exception as e:
                self.logger.debug(e)
        return response

    def process_exception(self, request, exception):
        return None
