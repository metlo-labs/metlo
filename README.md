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

With Metlo you can:

* **Create an Inventory of all your API Endpoints and Sensitive Data.**
* **Detect common API vulnerabilities.**
* **Proactively test your APIs before they go into production.**
* **Detect API attacks in real time.**

Metlo does this by scanning your API traffic using one of our connectors and then analyzing trace data.

## Get started for free!
<a href="https://app.metlo.com">
  <img src="https://metlo-api-security-public.s3.us-west-2.amazonaws.com/cloud-button.svg" alt="drawing" height="40"/>
</a>
<a href="https://demo.metlo.com">
  <img src="https://metlo-api-security-public.s3.us-west-2.amazonaws.com/demo-button.svg" alt="drawing" height="40"/>
</a>
<br/>
<br/>

There are three ways to get started with Metlo. Metlo Cloud, Metlo Self Hosted, and our Open Source product. We recommend Metlo Cloud for almost all users as it scales to 100s of millions of requests per month and all upgrades and migrations are managed for you.

You can get started with Melto Cloud right away without a credit card. Just make an account on https://app.metlo.com and follow the instructions in our docs [here](https://docs.metlo.com/docs/getting-started).

Although we highly recommend Metlo Cloud, if you're a large company or need an air-gapped system you can self host Metlo as well! Create an account on https://my.metlo.com and follow the instructions on our docs [here](https://docs.metlo.com/docs/metlo-self-hosted) to setup Metlo in your own Cloud environment.

If you want to deploy our Open Source product we have instructions for [AWS](https://docs.metlo.com/docs/deploy-to-aws), [GCP](https://docs.metlo.com/docs/deploy-to-gcp), [Azure](https://docs.metlo.com/docs/deploy-to-azure) and [Docker](https://docs.metlo.com/docs/deploy-to-docker).

You can also join our [Discord community](https://discord.gg/4xhumff9BX) if you need help or just want to chat!

## Features
![walkthrough](https://storage.googleapis.com/metlo-security-public-images/walkthrough.gif)

* **Endpoint Discovery** - Metlo scans network traffic and creates an inventory of every single endpoint in your API.
* **Sensitive Data Scannning** - Each endpoint is scanned for PII data and given a risk score.
* **Vulnerability Discovery** - Get Alerts for issues like unauthenticated endpoints returning sensitive data, No HSTS headers, PII data in URL params, Open API Spec Diffs and more
* **API Security Testing** - Build security tests directly in Metlo with a simple HTTP Request editor and javascript assertions.
* **CI/CD Integration** - Integrate with your CI/CD to find issues in development and staging.
* **Attack Detection** - Our ML Algorithms build a model for baseline API behavior. Any deviation from this baseline is surfaced to your security team as soon as possible.
* **Attack Context** - Metlo’s UI gives you full context around any attack to help quickly fix the vulnerability.

## Testing
![Testing Screenshot](https://storage.googleapis.com/metlo-security-public-images/testing.png)

For tests that we can't autogenerate, our built in testing framework helps you get to **100% Security Coverage on your highest risk APIs.** You can build requests in an http editor and write javascript assertions to make sure your API is working as intendend.

For example the following checks if an API returns a `401`:

```javascript
m.test("Test Status Code Unauthorized", () => {
    expect(m.response.status).toBe(401)
})
```

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
