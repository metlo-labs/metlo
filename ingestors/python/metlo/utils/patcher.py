from ..instrumentation.db import apply_db_patches
from ..instrumentation.file_inclusion import apply_open_patches
from ..instrumentation.requests import apply_requests_patches
from ..instrumentation.os import apply_os_patches


class Patcher(object):
    def __init__(self, **kwargs):
        self.file_inclusion_enabled = kwargs.get("file_inclusion_enabled", True)
        self.db_logging_enabled = kwargs.get("db_logging_enabled", True)
        self.requests_logging_enabled = kwargs.get("requests_logging_enabled", True)
        self.system_cmd_logging_enabled = kwargs.get("system_cmd_logging_enabled", True)

        if self.file_inclusion_enabled:
            apply_open_patches()

        if self.db_logging_enabled:
            apply_db_patches()

        if self.requests_logging_enabled:
            apply_requests_patches()

        if self.system_cmd_logging_enabled:
            apply_os_patches()
