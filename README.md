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

## Get started for free!

Run the following in your cloud environment:

```bash
git clone https://github.com/metlo-labs/metlo.git
cd metlo
docker-compose up
```

Now visit [http://localhost:8000](http://localhost:8000)

See our [Docs](https://docs.metlo.com/docs) for an in-depth walk-throughs on how to set up Metlo in your cloud environment. You can also join our [Slack community](https://metlo.com/slack) if you need help or just want to chat!

## Features
![walkthrough](https://storage.googleapis.com/metlo-security-public-images/walkthrough.gif)

* Undocumented, legacy and shadow API endpoints are an unknown and unprotected attack surface.
* Metlo scans network traffic and creates an inventory of every single endpoint in your API.
* Each endpoint is scanned for PII data and given a risk score.
* Metlo’s suite of automated tests and our security testing framework let you find vulnerabilities in production and development.
* Get Alerts for issues like unauthenticated endpoints returning sensitive data, No HSTS headers, PII data in URL params, Open API Spec Diffs and more.
* Integrates directly with your CI/CD.
* Our ML Algorithms build a model for baseline API behavior. Any deviation from this baseline is surfaced as soon as possible. (Coming Soon)
* Metlo’s UI gives you full context around any attack to help quickly fix the vulnerability. (Coming Soon)

## Testing
![Testing Screenshot](https://storage.googleapis.com/metlo-security-public-images/testing.png)

For tests that we can't autogenerate, our built in testing framework helps you get to **100% Security Coverage on your highest risk APIs.** You can build requests in an http editor and write javascript assertions to make sure your API is working as intendend.

For example the following checks if an API returns a `401`:

```javascript
m.test("Test Status Code Unauthorized", () => {
    expect(m.response.status).toBe(401)
})
```

## We're Hiring

We would love for you to come help us make Metlo better. [Come join us at Metlo!](mailto:akshay@metlo.com)

## Development

**1. Build the Common Modules**

```bash
$ cd common
$ yarn watch
```

**2. Start the Frontend**

```bash
$ cd frontend
$ yarn install
$ yarn dev
```

**3. Start the Backend**

```bash
$ cd backend
$ yarn install
$ yarn dev
```

**4. Start the Job Runner**

```bash
$ cd backend
$ yarn dev-jobs
```
