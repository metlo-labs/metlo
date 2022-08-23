import newman from "newman";
import {
  CollectionDefinition,
  RequestDefinition,
  RequestBodyDefinition,
} from "postman-collection";
import { RequestBodyType } from "@common/testing/enums";
import { Request } from "@common/testing/types";
import { Test } from "@common/testing/types";

const requestToItem = (e: Request, i: number) => {
  const event = e.tests.trim()
    ? [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: e.tests.split("\n"),
          },
        },
      ]
    : [];
  let body: RequestBodyDefinition = { mode: "raw" };
  if (e.body.type == RequestBodyType.JSON) {
    body.raw = e.body.data as string;
  }
  let url: string = e.url;
  if (e.params.length > 0) {
    url = `${url}?${e.params.map((p) => `${p.key}=${p.value}`).join("&")}`;
  }
  let item = {
    name: `Request ${i}`,
    event: event,
    request: {
      url: e.url,
      method: e.method,
      header: e.headers,
      body: body,
    } as RequestDefinition,
  };
  return item;
};

export const runTest = (e: Test) => {
  const items = e.requests.map(requestToItem);
  const collection: CollectionDefinition = {
    info: {
      name: "Sample Postman Collection",
    },
    item: items,
  };
  const res = newman.run(
    {
      collection,
    },
    (a, b) => {
      console.log(JSON.stringify(a, null, 4));
      console.log(JSON.stringify(b, null, 4));
    }
  );
};
