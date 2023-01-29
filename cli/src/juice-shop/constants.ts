export const JUICE_SHOP_BOLA = `
import {
  AssertionType,
  GenTestEndpoint,
  TestBuilder,
  TestStepBuilder,
} from "@metlo/testing";

const USER_LOGIN_STEP = (user: string) =>
  new TestStepBuilder({
    method: "POST",
    url: "{{BASE_URL}}/rest/user/login",
    headers: [
      {
        name: "Content-Type",
        value: "application/json",
      },
    ],
    data: \`{\"email\": "{{global.\${user}_EMAIL}}", \"password\": "{{global.\${user}_PASSWORD}}"}\`,
  })
    .assert({
      key: "resp.status",
      type: "EQ",
      value: 200,
    })
    .extract({
      name: \`\${user}_JWT\`,
      type: "JS",
      value: '"Bearer ".concat(resp.data.authentication.token)',
    });

export default {
  name: "JUICE_SHOP_BOLA",
  version: 1,
  builder: (endpoint: GenTestEndpoint) => {
    return new TestBuilder()
      .setMeta({
        name: \`\${endpoint.path} BOLA\`,
        severity: "HIGH",
        tags: ["BOLA"],
      })
      .addTestStep(USER_LOGIN_STEP("USER_1"))
      .addTestStep(USER_LOGIN_STEP("USER_2"))
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint, "USER_1").assert("resp.status < 400")
      )
      .addTestStep(
        TestStepBuilder.sampleRequestWithoutAuth(endpoint, "USER_1")
          .addAuth(endpoint, "USER_2")
          .assert({
            type: AssertionType.EQ,
            key: "resp.status",
            value: [401, 403],
          })
      )
      .addTestStep(
        TestStepBuilder.sampleRequestWithoutAuth(endpoint, "USER_2")
          .addAuth(endpoint, "USER_1")
          .assert({
            type: AssertionType.EQ,
            key: "resp.status",
            value: [401, 403],
          })
      );
  },
};

`

export const JUICE_SHOP_BROKEN_AUTHENTICATION = `
import {
  AssertionType,
  GenTestEndpoint,
  TestBuilder,
  TestStepBuilder,
} from "@metlo/testing";

const USER_LOGIN_STEP = (user: string) =>
  new TestStepBuilder({
    method: "POST",
    url: "{{BASE_URL}}/rest/user/login",
    headers: [
      {
        name: "Content-Type",
        value: "application/json",
      },
    ],
    data: \`{\"email\": "{{global.\${user}_EMAIL}}", \"password\": "{{global.\${user}_PASSWORD}}"}\`,
  })
    .assert({
      key: "resp.status",
      type: "EQ",
      value: 200,
    })
    .extract({
      name: \`\${user}_JWT\`,
      type: "JS",
      value: '"Bearer ".concat(resp.data.authentication.token)',
    });

export default {
  name: "JUICE_SHOP_BROKEN_AUTHENTICATION",
  version: 1,
  builder: (endpoint: GenTestEndpoint) => {
    return new TestBuilder()
      .setMeta({
        name: \`\${endpoint.path} Broken Authentication\`,
        severity: "HIGH",
        tags: ["BROKEN_AUTHENTICATION"],
      })
      .addTestStep(USER_LOGIN_STEP("USER_1"))
      .addTestStep(
        TestStepBuilder.sampleRequestWithoutAuth(endpoint)
          .addAuth(endpoint, "USER_1")
          .assert("resp.status <= 400")
      )
      .addTestStep(
        TestStepBuilder.sampleRequestWithoutAuth(endpoint).assert({
          type: AssertionType.EQ,
          key: "resp.status",
          value: [401, 403],
        })
      );
  },
};

`

export const JUICE_SHOP_SQL_INJECTION = `
import { GenTestEndpoint, TestBuilder, TestStepBuilder } from "@metlo/testing"

const USER_LOGIN_STEP = (user: string) =>
  new TestStepBuilder({
    method: "POST",
    url: \`{{BASE_URL}}/rest/user/login\`,
    headers: [
      {
        name: "Content-Type",
        value: "application/json",
      },
    ],
    data: \`{\"email\": "{{global.\${user}_EMAIL}}", \"password\": "{{global.\${user}_PASSWORD}}"}\`,
  })
    .assert({
      key: "resp.status",
      type: "EQ",
      value: 200,
    })
    .extract({
      name: \`\${user}_JWT\`,
      type: "JS",
      value: '"Bearer ".concat(resp.data.authentication.token)',
    });

export default {
  name: "JUICE_SHOP_SQLI",
  version: 1,
  builder: (endpoint: GenTestEndpoint) =>
    new TestBuilder()
      .setMeta({
        name: \`\${endpoint.path} SQLI\`,
        severity: "HIGH",
        tags: ["SQLI"],
      })
      .setOptions({
        stopOnFailure: true,
      })
      .addTestStep(USER_LOGIN_STEP("USER_1"))
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint, "USER_1")
          .addPayloads({
            key: "SQLI_PAYLOAD",
            value: "SQLI",
          })
          .modifyRequest(req => {
            if (req.query && req.query.length > 0) {
              req.query[0].value = "{{SQLI_PAYLOAD}}"
              return req
            }
            if (req.form && req.form.length > 0) {
              req.form[0].value = "{{SQLI_PAYLOAD}}"
              return req
            }
            if (
              req.data &&
              req.headers?.find(e => e.name == "Content-Type")?.value ==
                "application/json"
            ) {
              const parsed = JSON.parse(req.data)
              const keys = Object.keys(parsed)
              if (keys.length > 0) {
                parsed[keys[0]] = "{{SQLI_PAYLOAD}}"
              }
              req.data = JSON.stringify(parsed, null, 4)
              return req
            }
            return req
          })
          .assert("resp.status > 400"),
      ),
}

`

export const JUICE_SHOP_SQL_INJECTION_TIME_BASED = `
import { GenTestEndpoint, TestBuilder, TestStepBuilder } from "@metlo/testing"

const USER_LOGIN_STEP = (user: string) =>
  new TestStepBuilder({
    method: "POST",
    url: \`{{BASE_URL}}/rest/user/login\`,
    headers: [
      {
        name: "Content-Type",
        value: "application/json",
      },
    ],
    data: \`{\"email\": "{{global.\${user}_EMAIL}}", \"password\": "{{global.\${user}_PASSWORD}}"}\`,
  })
    .assert({
      key: "resp.status",
      type: "EQ",
      value: 200,
    })
    .extract({
      name: \`\${user}_JWT\`,
      type: "JS",
      value: '"Bearer ".concat(resp.data.authentication.token)',
    });

export default {
  name: "JUICE_SHOP_SQLI_TIME_BASED",
  version: 1,
  builder: (endpoint: GenTestEndpoint) =>
    new TestBuilder()
      .setMeta({
        name: \`\${endpoint.path} SQLI TIME BASED\`,
        severity: "HIGH",
        tags: ["SQLI_TIME_BASED"],
      })
      .setOptions({
        stopOnFailure: true,
      })
      .addTestStep(USER_LOGIN_STEP("USER_1"))
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint, "USER_1")
          .addPayloads({
            key: "SQLI_PAYLOAD",
            value: "SQLI_TIME",
          })
          .modifyRequest(req => {
            if (req.query && req.query.length > 0) {
              req.query[0].value = "{{SQLI_PAYLOAD}}"
              return req
            }
            if (req.form && req.form.length > 0) {
              req.form[0].value = "{{SQLI_PAYLOAD}}"
              return req
            }
            if (
              req.data &&
              req.headers?.find(e => e.name == "Content-Type")?.value ==
                "application/json"
            ) {
              const parsed = JSON.parse(req.data)
              const keys = Object.keys(parsed)
              if (keys.length > 0) {
                parsed[keys[0]] = "{{SQLI_PAYLOAD}}"
              }
              req.data = JSON.stringify(parsed, null, 4)
              return req
            }
            return req
          })
          .assert("resp.duration < 1000"),
      ),
}

`
