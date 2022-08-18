import React, { useCallback, useState } from "react";
import { ApiEndpointDetailed } from "@common/types";
import { Request, Test } from "@common/testing/types";
import {
  Button,
  Editable,
  EditableInput,
  EditablePreview,
  HStack,
  StackDivider,
  VStack,
} from "@chakra-ui/react";
import TestEditorHeader from "./header";
import RequestList from "./requestsList";
import RequestEditor from "./requestEditor";
import { makeNewEmptyRequest, sendRequest } from "./requestUtils";

interface TestEditorProps {
  endpoint: ApiEndpointDetailed;
  initTest: Test;
}

interface TestEditorState {
  test: Test;
  selectedRequest: number;
}

const TestEditor: React.FC<TestEditorProps> = React.memo(
  ({ endpoint, initTest }) => {
    const [state, setState] = useState<TestEditorState>({
      test: initTest,
      selectedRequest: 0,
    });
    const [fetching, updateFetching] = useState<boolean>(false);

    const selectedRequest = state.selectedRequest;
    const updateSelectedRequest = useCallback(
      (e: number) => {
        setState((state) => {
          return {
            ...state,
            selectedRequest: e,
          };
        });
      },
      [setState]
    );

    const test = state.test;
    const updateTest = useCallback(
      (t: (e: Test) => Test) => {
        setState((state) => {
          return {
            ...state,
            test: t(state.test),
          };
        });
      },
      [setState]
    );

    const updateRequest = useCallback(
      (t: (e: Request) => Request) =>
        updateTest((test) => {
          let newRequests = [...test.requests];
          newRequests[selectedRequest] = t(newRequests[selectedRequest]);
          return {
            ...test,
            requests: newRequests,
          };
        }),
      [updateTest, selectedRequest]
    );

    const addNewRequest = useCallback(
      () =>
        setState((state) => {
          const test = state.test;
          let newRequests = [...test.requests, makeNewEmptyRequest(endpoint)];
          return {
            selectedRequest: newRequests.length - 1,
            test: {
              ...test,
              requests: newRequests,
            },
          };
        }),
      [setState]
    );

    const deleteRequest = useCallback(
      (idx: number) =>
        setState((state) => {
          const test = state.test;
          if (test.requests.length == 1) {
            return state;
          }
          const newRequests = test.requests.filter((_, i) => i != idx);
          const newSelectedRequest =
            idx <= state.selectedRequest
              ? Math.max(state.selectedRequest - 1, 0)
              : state.selectedRequest;
          return {
            selectedRequest: newSelectedRequest,
            test: {
              ...test,
              requests: newRequests,
            },
          };
        }),
      [setState]
    );

    const sendSelectedRequest = () => {
      updateFetching(true);
      sendRequest(test.requests[selectedRequest])
        .then((e) => {
          const result = {
            code: e.status,
            headers: Object.entries(e.headers).map((e) => ({
              key: e[0],
              value: e[1] as string,
            })),
            testResults: [],
            body: e.data,
          };
          updateRequest((e) => ({ ...e, result }));
        })
        .catch((e) => {
          const result = {
            code: e.response.status,
            headers: e.response.headers,
            testResults: [],
            body: e.response.data,
          };
          updateRequest((e) => ({ ...e, result }));
        })
        .finally(() => {
          updateFetching(false);
        });
    };

    return (
      <VStack
        w="full"
        alignItems="flex-start"
        spacing="0"
        h="100vh"
        overflow="hidden"
        divider={<StackDivider />}
      >
        <VStack alignItems="flex-start" px="6" pt="4" w="full">
          <TestEditorHeader endpoint={endpoint} />
          <HStack justifyContent="space-between" w="full" pb="4">
            <Editable
              value={test.name}
              onChange={(name) => updateTest((e) => ({ ...e, name }))}
              fontSize="2xl"
              fontWeight="semibold"
            >
              <EditablePreview />
              <EditableInput />
            </Editable>
            <Button colorScheme="blue">Save</Button>
          </HStack>
        </VStack>
        <HStack
          flex="1"
          overflow="hidden"
          w="full"
          divider={<StackDivider />}
          spacing="0"
        >
          <RequestList
            requests={test.requests}
            selectedRequest={selectedRequest}
            updateSelectedRequest={updateSelectedRequest}
            addNewRequest={addNewRequest}
            deleteRequest={deleteRequest}
            h="full"
            w="72"
          />
          <RequestEditor
            flexGrow="1"
            sendSelectedRequest={sendSelectedRequest}
            fetching={fetching}
            request={test.requests[selectedRequest]}
            updateRequest={updateRequest}
          />
        </HStack>
      </VStack>
    );
  }
);

export default TestEditor;
