import wrapt

from ..instrumentation.db import connect_wrapper
from ..instrumentation.file_inclusion import open_wrapper


db_modules = [
    ("sqlite3.dbapi2", "connect", connect_wrapper),
    ("MySQLdb", "connect", connect_wrapper),
    ("psycopg2", "connect", connect_wrapper),
]


class Patcher(object):
    def __init__(self, **kwargs):
        self.file_inclusion_enabled = kwargs.get("file_inclusion_enabled", True)
        self.db_logging_enabled = kwargs.get("db_logging_enabled", True)

        if self.file_inclusion_enabled:
            open_wrapper()

        if self.db_logging_enabled:
            for item in db_modules:

                @wrapt.when_imported(item[0])
                def apply_patches(module):
                    wrapt.wrap_function_wrapper(module, item[1], item[2])
