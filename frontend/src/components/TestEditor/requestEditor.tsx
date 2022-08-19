import React from "react";
import {
  VStack,
  StackProps,
  Input,
  HStack,
  Button,
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  StackDivider,
  Text,
  useColorModeValue,
  Code,
} from "@chakra-ui/react";
import { Request } from "@common/testing/types";
import Select from "react-select";
import { RestMethod } from "@common/enums";
import { SectionHeader } from "../utils/Card";
import DataPairEditor from "../utils/DataPairEditor";
import RequestBodyEditor from "./bodyEditor";
import TestScriptEditor from "./testScriptEditor";
import { getMethodSelectStyles } from "./styles";
import Response from "./responseViewer";

interface RequestEditorProps extends StackProps {
  request: Request;
  sendSelectedRequest: () => void;
  fetching: boolean;
  updateRequest: (t: (e: Request) => Request) => void;
}

const RequestEditor: React.FC<RequestEditorProps> = React.memo(
  ({ request, fetching, sendSelectedRequest, updateRequest, ...props }) => {
    const methodMenuBg = useColorModeValue("white", "rgb(19, 22, 26)");
    return (
      <VStack
        h="full"
        {...props}
        spacing="0"
        divider={<StackDivider />}
        resize={"both"}
      >
        <VStack
          h="60%"
          w="full"
          spacing="0"
          resize={"both"}
        >
          <HStack w="full" spacing="0" px="4" pt="4" pb="2">
            <Box w="36">
              <Select
                id="test-request-method-selector"
                instanceId="test-request-method-selector"
                styles={getMethodSelectStyles(methodMenuBg)}
                options={Object.entries(RestMethod).map((e) => ({
                  value: e[1],
                  label: e[1],
                }))}
                value={{
                  value: request.method,
                  label: request.method,
                }}
                onChange={(e) =>
                  updateRequest((old) => ({ ...old, method: e.value }))
                }
              />
            </Box>
            <Input
              placeholder="URL"
              rounded="none"
              bg="secondaryBG"
              value={request.url}
              onChange={(evt) =>
                updateRequest((old) => ({ ...old, url: evt.target.value }))
              }
              flexGrow="1"
            />
            <Button
              colorScheme="blue"
              px="8"
              roundedLeft="none"
              onClick={sendSelectedRequest}
              isLoading={fetching}
            >
              Send
            </Button>
          </HStack>
          <Tabs
            display="flex"
            flexDir="column"
            flexGrow="1"
            overflow="hidden"
            w="full"
          >
            <TabList borderBottom="none">
              <Tab>
                <SectionHeader text="Params" />
              </Tab>
              <Tab>
                <SectionHeader text="Authorization" />
              </Tab>
              <Tab>
                <SectionHeader text="Headers" />
              </Tab>
              <Tab>
                <SectionHeader text="Body" />
              </Tab>
              <Tab>
                <SectionHeader text="Tests" />
              </Tab>
            </TabList>
            <TabPanels flexGrow="1">
              <TabPanel p="0" h="full">
                <DataPairEditor
                  title="Query Params"
                  pairs={request.params}
                  updatePairs={(t) =>
                    updateRequest((e) => ({ ...e, params: t(e.params) }))
                  }
                />
              </TabPanel>
              <TabPanel p="0" h="full"></TabPanel>
              <TabPanel p="0" h="full">
                <DataPairEditor
                  title="Headers"
                  pairs={request.headers}
                  updatePairs={(t) =>
                    updateRequest((e) => ({ ...e, headers: t(e.headers) }))
                  }
                />
              </TabPanel>
              <TabPanel p="0" h="full">
                <RequestBodyEditor
                  body={request.body}
                  updateBody={(t) =>
                    updateRequest((e) => ({ ...e, body: t(e.body) }))
                  }
                />
              </TabPanel>
              <TabPanel p="0" h="full">
                <TestScriptEditor
                  testScript={request.tests}
                  updateTestScript={(t) =>
                    updateRequest((e) => ({ ...e, tests: t(e.tests) }))
                  }
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
        <VStack h="40%" w="full">
          <Box h="full" w="full" overflow="scroll" py={2}>
            <Response
              res={
                request.result || {
                  body: "",
                  headers: [],
                  testResults: [],
                  code: NaN,
                  statusText: "",
                  duration: NaN,
                }
              }
            />
          </Box>
        </VStack>
      </VStack>
    );
  }
);

export default RequestEditor;
