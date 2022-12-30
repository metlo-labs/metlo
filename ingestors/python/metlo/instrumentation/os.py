import wrapt

from ..utils.request_context import ctx_store


def system_wrapper(wrapped, instance, args, kwargs):
    if ctx_store._get_obj():
        if "system_commands" not in ctx_store:
            ctx_store.system_commands = []
        if len(args) > 0:
            ctx_store.system_commands.append(args[0])
    return wrapped(*args, **kwargs)


def apply_os_patches():
    @wrapt.when_imported("os")
    def apply_patches(module):
        wrapt.wrap_function_wrapper(module, "system", system_wrapper)
