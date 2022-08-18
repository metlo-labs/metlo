<p align="center">
  <img alt="Logo" src="https://storage.googleapis.com/metlo-security-public-images/metlo_logo_horiz%404x.jpg" height="80" />
  <h1 align="center">Metlo API Security</h1>
  <p align="center">Secure Your API.</p>
</p>

---
<div align="center">

[![Prs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=shields)](http://makeapullrequest.com)
[![Join Slack Community](https://img.shields.io/badge/slack%20community-join-blue)](https://metlo.com/slack)
![Github Commit Activity](https://img.shields.io/github/commit-activity/m/metlo-labs/metlo)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/metlo-labs/metlo/build)
[![License](https://img.shields.io/badge/license-MIT-brightgreen)](/LICENSE)

</div>

---

## Metlo is an open-source API security platform
* Create an Inventory of all your API Endpoints.
* Proactively test your APIs before they go into production.
* Detect API attacks in real time.

## Quick start
```bash
git clone https://github.com/metlo-labs/metlo.git
cd metlo
docker-compose up
```

Now visit [http://localhost:8000](http://localhost:8000)

## Features
### Endpoint Discovery
* Undocumented, legacy and shadow API endpoints are an unknown and unprotected attack surface.
* Metlo scans network traffic and creates an inventory of every single endpoint in your API.
* Each endpoint is scanned for PII data and given a risk score.

![Discovery Screenshot](https://storage.googleapis.com/metlo-security-public-images/discovery.png)

### API Testing
* Don’t wait for an attack to discover API vulnerabilities. Metlo’s suite of automated tests and our security testing framework let you find vulnerabilities in development.
* Our DAST scans your API’s for the most common security vulnerabilities.
* Metlo’s built in testing framework helps you get to 100% Security Coverage on your highest risk APIs
* Metlo integrates directly with your CI/CD

### Protection
* After an API vulnerability is discovered, intruders can quickly start the process of extracting sensitive data. Metlo alerts your security team as soon as anomalous API usage patterns are detected.
* Our ML Algorithms build a model for baseline API behavior. Any deviation from this baseline is surfaced as soon as possible.
* Metlo’s UI gives you full context around any attack to help quickly fix the vulnerability.
