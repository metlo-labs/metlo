import builtins
from ..utils.request_context import ctx_store


def wrapped_open(*args, **kwargs):
    if ctx_store._get_obj() and "files_accessed" not in ctx_store:
        ctx_store.files_accessed = []
    ctx_store.files_accessed.append({"filePath": args[0]})
    return builtins.builtinOpen(*args, **kwargs)


def open_wrapper():
    builtins.builtinOpen = builtins.open
    builtins.open = wrapped_open
