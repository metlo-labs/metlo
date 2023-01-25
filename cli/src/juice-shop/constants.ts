// @ts-nocheck

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
  name: "JUICE_SHOP_BOLA",
  version: 5,
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
        TestStepBuilder.sampleRequest(endpoint, "USER_1").assert({
          type: AssertionType.JS,
          value: "resp.status < 400",
        })
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
  name: "JUICE_SHOP_BROKEN_AUTHENTICATION",
  version: 7,
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
          .assert({
            type: "JS",
            value: "resp.status <= 400",
          })
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
