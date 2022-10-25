<p align="center">
  <img alt="logo" src="https://storage.googleapis.com/metlo-security-public-images/metlo_logo_horiz%404x.png" height="80">
  <h1 align="center">Metlo API Security</h1>
  <p align="center">Secure Your API.</p>
</p>

## Installation

Currently Metlo's Python Agent supports 2 servers:

- Django
- Flask

It can be installed from `pypi` by running :

```shell
pip install metlo
```

## Configuration

### Django

Once installed, Metlo's middleware can be added by modifying middlewares list (in the projects `settings.py`) like so:

```python
MIDDLEWARE = [
    ...,
    "metlo.django.MetloDjango",
] 
```

and configuring a `METLO_CONFIG` attribute in the projects `settings.py` like this :

```python
METLO_CONFIG = {
    "API_KEY": "<YOUR_METLO_API_KEY>",
    "METLO_HOST": "<YOUR_METLO_COLLECTOR_URL>"
}
```

`METLO_CONFIG` can take an optional key-value pair representing the max number of workers for communicating with Metlo.

### Flask

Once installed, Metlo middleware can be added simply like:

```python
from flask import Flask

...
from metlo.flask import MetloFlask

app = Flask(__name__)
MetloFlask(app, "<YOUR_METLO_COLLECTOR_URL>", "<YOUR_METLO_API_KEY>")
```

The Flask Middleware takes the flask app, Metlo collector url, and the Metlo API Key as parameters. As an optional
parameter, a named value can be passed for max number of workers for communicating with Metlo.

```python
MetloFlask(app, "<YOUR_METLO_COLLECTOR_URL>", "<YOUR_METLO_API_KEY>", workers="<WORKER-COUNT>")
```