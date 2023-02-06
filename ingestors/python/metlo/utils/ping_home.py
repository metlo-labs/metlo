from logging import Logger
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ENDPOINT = "api/v1/verify"


def ping_home(host: str, api_key: str, logger: Logger):
    try:
        req = Request(
            url=host + ENDPOINT,
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": api_key,
            },
            method="GET",
        )
        resp = urlopen(url=req, timeout=5)
        print(resp)        
    except HTTPError as e:
        if e.code == 404:
            print(
                f"Metlo host at {host} is unreachable.\nMetlo host may be incorrect or metlo version may be old"
            )
        elif e.code == 401:
            logger.error("Could not validate Metlo API key.")
        elif not e.code == 200:
            logger.error(
                f"Problem encountered while validating connection to Metlo.\nReceived error code {e.code}."
            )
    except URLError as e:
        if e.args[0].args[0] == "timed out":
            logger.error("Connection to metlo timed out.")
        else:
            logger.exception("Encountered unknown error",e)
