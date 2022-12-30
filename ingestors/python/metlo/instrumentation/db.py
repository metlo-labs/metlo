import wrapt
from time import perf_counter
from sql_metadata import Parser

from ..utils.time_utils import get_time_elapsed
from ..utils.request_context import ctx_store


def get_query_metadata(query):
    res = {"tables": [], "columns": []}
    try:
        parsed_query = Parser(query)
        res["tables"] = parsed_query.tables
        res["columns"] = parsed_query.columns
    except Exception:
        pass
    return res


def execute_handler(wrapped, *args, **kwargs):
    query_start = perf_counter()
    res = wrapped(*args, **kwargs)
    query_time = get_time_elapsed(query_start)
    query_metadata = get_query_metadata(args[0])
    if ctx_store._get_obj():
        if "db_queries" not in ctx_store:
            ctx_store.db_queries = []
        ctx_store.db_queries.append(
            {
                "dbHost": ctx_store.db_host,
                "query": args[0],
                "tablesAccessed": query_metadata["tables"],
                "columnsAccessed": query_metadata["columns"],
                "queryTime": query_time,
                "resRows": 0,
            }
        )
    return res


def fetch_handler(wrapped, *args, **kwargs):
    query_start = perf_counter()
    res = wrapped(*args, **kwargs)
    query_time = get_time_elapsed(query_start)
    if res and ctx_store._get_obj() and "db_queries" in ctx_store:
        ctx_store.db_queries[-1]["resRows"] += (
            len(res) if isinstance(res[0], list) or isinstance(res[0], tuple) else 1
        )
        ctx_store.db_queries[-1]["queryTime"] += query_time
    return res


class CursorProxy(wrapt.ObjectProxy):
    def execute(self, *args, **kwargs):
        return execute_handler(self.__wrapped__.execute, *args, **kwargs)

    def executemany(self, *args, **kwargs):
        return execute_handler(self.__wrapped__.executemany, *args, **kwargs)

    def fetchmany(self, *args, **kwargs):
        return fetch_handler(self.__wrapped__.fetchmany, *args, **kwargs)

    def fetchone(self, *args, **kwargs):
        return fetch_handler(self.__wrapped__.fetchone, *args, **kwargs)

    def fetchall(self, *args, **kwargs):
        return fetch_handler(self.__wrapped__.fetchall, *args, **kwargs)


class ConnectionProxy(wrapt.ObjectProxy):
    def cursor(self, *args, **kwargs):
        return CursorProxy(self.__wrapped__.cursor(*args, **kwargs))


class ConnectionProxyExtended(ConnectionProxy):
    def execute(self, *args, **kwargs):
        return execute_handler(self.__wrapped__.execute, *args, **kwargs)

    def executemany(self, *args, **kwargs):
        return execute_handler(self.__wrapped__.executemany, *args, **kwargs)


def connect_wrapper(wrapped, instance, args, kwargs):
    real_conn = wrapped(*args, **kwargs)
    if ctx_store._get_obj():
        if hasattr(real_conn, "get_dsn_parameters"):
            ctx_store.db_host = real_conn.get_dsn_parameters()["host"]
        else:
            ctx_store.db_host = str(
                kwargs.get(
                    "host", kwargs.get("database", args[0] if len(args) > 0 else "")
                )
            )
    if hasattr(real_conn, "execute"):
        return ConnectionProxyExtended(real_conn)
    return ConnectionProxy(real_conn)


def apply_db_patches():
    @wrapt.when_imported("sqlite3.dbapi2")
    def apply_patches(module):
        wrapt.wrap_function_wrapper(module, "connect", connect_wrapper)

    @wrapt.when_imported("MySQLdb")
    def apply_patches(module):
        wrapt.wrap_function_wrapper(module, "connect", connect_wrapper)

    @wrapt.when_imported("psycopg2")
    def apply_patches(module):
        wrapt.wrap_function_wrapper(module, "connect", connect_wrapper)
