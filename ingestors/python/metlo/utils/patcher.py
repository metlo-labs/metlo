from ..instrumentation.db import apply_db_patches
from ..instrumentation.file_inclusion import open_wrapper
from ..instrumentation.requests import apply_requests_patches


class Patcher(object):
    def __init__(self, **kwargs):
        self.file_inclusion_enabled = kwargs.get("file_inclusion_enabled", True)
        self.db_logging_enabled = kwargs.get("db_logging_enabled", True)
        self.requests_logging_enabled = kwargs.get("requests_logging_enabled", True)

        if self.file_inclusion_enabled:
            open_wrapper()

        if self.db_logging_enabled:
            apply_db_patches()

        if self.requests_logging_enabled:
            apply_requests_patches()
