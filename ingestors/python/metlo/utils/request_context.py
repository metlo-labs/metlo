import threading
from functools import partial


class RequestContext(object):
    def __init__(self):
        self.__request_context = threading.local()
        setattr(self.__request_context, "ctx_store", Context())

    def get_attr(self, key, default=None):
        return getattr(self.__request_context, key, default)

    def clear(self):
        return self.__request_context.__dict__.clear()

    def init_at_request(self):
        setattr(self.__request_context, "ctx_store", Context())


class Context(object):
    def get(self, name, default=None):
        return self.__dict__.get(name, default)

    def pop(self, name, default=None):
        return self.__dict__.pop(name, default)

    def setdefault(self, name, default=None):
        return self.__dict__.setdefault(name, default)

    def __contains__(self, item):
        return item in self.__dict__

    def __iter__(self):
        return iter(self.__dict__)


class RequestContextProxy(object):
    def __init__(self, wrapped_func):
        object.__setattr__(self, "_RequestContextProxy__wrapped_func", wrapped_func)

    def _get_obj(self):
        obj = self.__wrapped_func()
        return obj

    @property
    def __dict__(self):
        return self._get_obj().__dict__

    def __repr__(self):
        return repr(self._get_obj())

    def __str__(self):
        return str(self._get_obj())

    def __dir__(self):
        return dir(self._get_obj())

    def __getattr__(self, name):
        return getattr(self._get_obj(), name)

    def __setattr__(self, key, value):
        return setattr(self._get_obj(), key, value)

    def __delattr__(self, item):
        return delattr(self._get_obj(), item)

    def __iter__(self):
        return iter(self._get_obj())


request_context = RequestContext()
ctx_store = RequestContextProxy(partial(request_context.get_attr, "ctx_store"))
