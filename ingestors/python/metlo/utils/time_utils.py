from time import perf_counter


def get_time_elapsed(start_time: int):
    time_elapsed = perf_counter() - start_time
    return time_elapsed * 1000
