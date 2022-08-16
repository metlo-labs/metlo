import React, { useState } from "react";
import { ApiEndpointDetailed } from "@common/types";
import { Test } from "@common/testing/types";
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

interface TestEditorProps {
  endpoint: ApiEndpointDetailed;
  initTest: Test;
}

const TestEditor: React.FC<TestEditorProps> = React.memo(
  ({ endpoint, initTest }) => {
    const [test, updateTest] = useState<Test>(initTest);
    const [selectedRequest, updatedSelectedRequest] = useState(0);
    return (
      <VStack
        w="full"
        alignItems="flex-start"
        spacing="0"
        h="100vh"
        overflow="hidden"
        divider={<StackDivider />}
      >
        <VStack alignItems="flex-start" pt="6" px="6" w="full">
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
        <HStack flexGrow="1" w="full" divider={<StackDivider />}>
          <RequestList
            requests={test.requests}
            selectedRequest={selectedRequest}
            updateSelectedRequest={updatedSelectedRequest}
            h="full"
            py="6"
            px="4"
            w="64"
          />
          <RequestEditor request={test.requests[selectedRequest]} />
        </HStack>
      </VStack>
    );
  }
);

export default TestEditor;
