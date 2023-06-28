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
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/metlo-labs/metlo/build.yml?branch=develop)
[![License](https://img.shields.io/badge/license-MIT-brightgreen)](/LICENSE)

</div>

---

## Metlo is an open-source API security platform

Metlo is an open source API security tool you can setup in < 15 minutes that inventories your endpoints, detects bad actors and blocks malicious traffic in real time.

* **Detect API attacks in real time.**
* **Automatically block malicious actors.**
* **Create an Inventory of all your API Endpoints and Sensitive Data.**
* **Proactively test your APIs before they go into production.**

## Get started for free!
<a href="https://app.metlo.com">
  <img src="https://metlo-api-security-public.s3.us-west-2.amazonaws.com/cloud-button.svg" alt="drawing" height="40"/>
</a>
<a href="https://my.metlo.com">
  <img src="https://metlo-api-security-public.s3.us-west-2.amazonaws.com/self-hosted-button.svg" alt="drawing" height="40"/>
</a>
<a href="https://demo.metlo.com">
  <img src="https://metlo-api-security-public.s3.us-west-2.amazonaws.com/demo-button.svg" alt="drawing" height="40"/>
</a>
<br/>
<br/>

There are three ways to get started with Metlo. Metlo Cloud, Metlo Self Hosted, and our Open Source product. We recommend Metlo Cloud for almost all users as it scales to billions of requests per month and all upgrades and migrations are managed for you.

You can get started with Melto Cloud right away without a credit card. Just make an account on https://app.metlo.com and follow the instructions in our docs [here](https://docs.metlo.com/docs/getting-started).

Although we highly recommend Metlo Cloud, if you're a large company or need an air-gapped system you can self host Metlo as well! Create an account on https://my.metlo.com and follow the instructions on our docs [here](https://docs.metlo.com/docs/metlo-self-hosted) to setup Metlo in your own Cloud environment.

If you want to deploy our Open Source product we have instructions for [AWS](https://docs.metlo.com/docs/deploy-to-aws), [GCP](https://docs.metlo.com/docs/deploy-to-gcp), [Azure](https://docs.metlo.com/docs/deploy-to-azure) and [Docker](https://docs.metlo.com/docs/deploy-to-docker).

You can also join our [Discord community](https://discord.gg/4xhumff9BX) if you need help or just want to chat!

## Features

[![Getting Started With Metlo](https://cdn.loom.com/sessions/thumbnails/a35ee39f2d474feabeda62cc078e3660-with-play.gif)](https://www.loom.com/share/a35ee39f2d474feabeda62cc078e3660 "Getting Started With Metlo")

* **Endpoint Discovery** - Metlo scans network traffic and creates an inventory of every single endpoint in your API.
* **Sensitive Data Scannning** - Each endpoint is scanned for PII data and given a risk score.
* **Attack Detection** - Metlo passively listens to your API traffic and tags every malicous request. Our models are built on patterns of malicous requests to detect bad actors and API attacks.
* **Attack Context** - Metlo’s UI gives you full context around any attack to help quickly fix the vulnerability.
* **Attack Blocking** - Our cloud detection engine identifies bad actors and builds a model of how your API works. Each agent pulls this metadata from the cloud to block malicious requests in real time.
* **API Security Testing** - Build security tests directly in Metlo. Autogenerate tests for OWASP Top 10 vulns like BOLA, Broken Authentication, SQL Injection and more.
* **CI/CD Integration** - Integrate with your CI/CD to find issues in development and staging.

## Testing
![Testing Screenshot](https://metlo-api-security-public.s3.us-west-2.amazonaws.com/testing-screenshot.png)

For tests that we can't autogenerate, our built in testing framework helps you get to **100% Security Coverage on your highest risk APIs.** You can build tests in a yaml format to make sure your API is working as intendend.

For example the following test checks for broken authentication:

```yaml
id: test-payment-processor-metlo.com-user-billing

meta:
  name: test-payment-processor.metlo.com/user/billing Test Auth
  severity: CRITICAL
  tags:
    - BROKEN_AUTHENTICATION

test:
  - request:
      method: POST
      url: https://test-payment-processor.metlo.com/user/billing
      headers:
        - name: Content-Type
          value: application/json
        - name: Authorization
          value: ...
      data: |-
        { "ccn": "...", "cc_exp": "...", "cc_code": "..." }
    assert:
      - key: resp.status
        value: 200
  - request:
      method: POST
      url: https://test-payment-processor.metlo.com/user/billing
      headers:
        - name: Content-Type
          value: application/json
      data: |-
        { "ccn": "...", "cc_exp": "...", "cc_code": "..." }
    assert:
      - key: resp.status
        value: [ 401, 403 ]
```

You can see more information on our [docs](https://docs.metlo.com/docs/writing-a-test).

## Why Metlo?

Most businesses have adopted public facing APIs to power their websites and apps.
This has dramatically increased the attack surface for your business.
There’s been a 200% increase in API security breaches in just the last year with the APIs of companies like Uber, Meta, Experian and Just Dial leaking millions of records.
It's obvious that tools are needed to help security teams make APIs more secure but there's no *great* solution on the market.

Some solutions require you to go through sales calls to even try the product while others have you to send all your API traffic to their own cloud. **Metlo is the first Open Source API security platform that you can self host, and get started for free right away!**

## We're Hiring!

We would love for you to come help us make Metlo better. [Come join us at Metlo!](mailto:akshay@metlo.com)

## Open-source vs. paid

This repo is entirely MIT licensed. Features like user management, user roles and attack protection require an enterprise license. [Contact us](mailto:shri@metlo.com) for more information.

## Development

Checkout our [development guide](https://docs.metlo.com/docs/development-guide) for more info on how to develop Metlo locally.
