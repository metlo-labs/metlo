import wrapt
from urllib.parse import urlparse, parse_qs
from time import perf_counter
import json

from ..utils.request_context import ctx_store


def requests_wrapper(wrapped, instance, args, kwargs):
    try:
        url = kwargs.get("url", args[0] if len(args) > 0 else "")
        parsedUrl = urlparse(url)
        body = kwargs.get("data", "")

        try:
            if not isinstance(body, str):
                body = json.dumps(body)
        except:
            pass

        if ctx_store._get_obj():
            if "requests" not in ctx_store:
                ctx_store.requests = []
            ctx_store.requests.append(
                {
                    "responseTime": None,
                    "request": {
                        "url": {
                            "host": f"{parsedUrl.scheme}://{parsedUrl.netloc}",
                            "path": parsedUrl.path,
                            "parameters": kwargs.get(
                                "params",
                                parse_qs(parsedUrl.query, keep_blank_values=True),
                            ),
                        },
                        "headers": kwargs.get("headers", {}),
                        "body": body,
                        "method": str(wrapped.__name__).upper(),
                    },
                    "response": {"status": None, "headers": {}, "body": ""},
                }
            )
    except:
        pass

    start_time = perf_counter()
    res = wrapped(*args, **kwargs)

    try:
        response_time = perf_counter() - start_time
        response_time_ms = int(response_time * 1000)
        if ctx_store._get_obj() and ctx_store.requests[-1]:
            ctx_store.requests[-1]["responseTime"] = response_time_ms
            ctx_store.requests[-1]["response"] = {
                "status": res.status_code,
                "headers": res.headers,
                "body": res.text if res.text else "",
            }
    except:
        pass
    return res


def apply_requests_patches():
    @wrapt.when_imported("requests")
    def apply_patches(module):
        wrapt.wrap_function_wrapper(module, "get", requests_wrapper)
        wrapt.wrap_function_wrapper(module, "post", requests_wrapper)
        wrapt.wrap_function_wrapper(module, "put", requests_wrapper)
        wrapt.wrap_function_wrapper(module, "delete", requests_wrapper)
        wrapt.wrap_function_wrapper(module, "head", requests_wrapper)
        wrapt.wrap_function_wrapper(module, "patch", requests_wrapper)
        wrapt.wrap_function_wrapper(module, "options", requests_wrapper)
