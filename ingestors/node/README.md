<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://storage.googleapis.com/metlo-security-public-images/metlo_logo_horiz_negative%404x.png" height="80">
    <img alt="logo" src="https://storage.googleapis.com/metlo-security-public-images/metlo_logo_horiz%404x.png" height="80">
  </picture>
  <h1 align="center">Metlo API Security</h1>
  <p align="center">Secure Your API.</p>
</p>

## Installation

Currently Metlo's Node Agent supports 3 frameworks: 
 - Express
 - Koa
 - Fastify

It can be installed from `npm` by running: 
```bash
npm install metlo
```
Or from `yarn` by running: 
```bash
yarn add metlo
```

## Configuration

Metlo can be added to any of the supported frameworks by adding the following lines as the start of your main script:

```js
var metlo = require("metlo")
metlo(<YOUR_METLO_API_KEY>, <YOUR_METLO_COLLECTOR_URL>)
```