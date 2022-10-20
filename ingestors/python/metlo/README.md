<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://storage.googleapis.com/metlo-security-public-images/metlo_logo_horiz_negative%404x.png" height="80">
    <img alt="logo" src="https://storage.googleapis.com/metlo-security-public-images/metlo_logo_horiz%404x.png" height="80">
  </picture>
  <h1 align="center">Metlo API Security</h1>
  <p align="center">Secure Your API.</p>
</p>

---
<div align="center">

[![Prs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=shields)](http://makeapullrequest.com)
[![Join Discord Server](https://img.shields.io/badge/discord%20community-join-blue)](https://discord.gg/4xhumff9BX)
![Github Commit Activity](https://img.shields.io/github/commit-activity/m/metlo-labs/metlo)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/metlo-labs/metlo/build)
[![License](https://img.shields.io/badge/license-MIT-brightgreen)](/LICENSE)

</div>

---

## Metlo is an open-source API security platform

* Create an Inventory of all your API Endpoints.
* Proactively test your APIs before they go into production.
* Detect API attacks in real time.

## Installation

Currently Metlo ingestor for Python supports 2 servers :

- Django
- Flask

It can be installed from `pypi` by running :

```bash
pip install metlo-python
```

If for some reason, a more manual method is required, then the code is available
on [github](https://github.com/metlo-labs/metlo/tree/develop/ingestors/python)

## Configuration

### Django

Once installed, METLO middleware can be added simply by modifying middlewares list (in the projects `settings.py`) like
so :

```python
MIDDLEWARE = [
    "......",
    ...,
    "......",
    "metlo.django.middleware.Middleware",
] 
```

and configuring a `METLO_CONFIG` attribute in the projects `settings.py` like this :

```python
METLO_CONFIG = {
    "API_KEY": "<API-KEY-GOES-HERE>",
    "METLO_HOST": "<METLO-COLLECTOR-URL>"
}
```

`METLO_CONFIG` can take an optional key-value pair representing the max number of workers for communicating with METLO.

### Flask

Once installed, METLO middleware can be added simply like :

```python
from flask import Flask

...
from metlo.flask.middleware import FlaskMiddleware

app = Flask(__name__)
FlaskMiddleware(app, "<METLO-COLLECTOR-URL>", "<API-KEY-GOES-HERE>")
```

The Flask Middleware takes the flask app, METLO collector url, and the METLO API Key as parameters. As an optional
parameter, a named value can be passed for max number of workers for communicating with METLO.

```python
FlaskMiddleware(app, "<METLO-COLLECTOR-URL>", "<API-KEY-GOES-HERE>", workers="<WORKER-COUNT>")
```