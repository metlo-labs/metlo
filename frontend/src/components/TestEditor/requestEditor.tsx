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
} from "@chakra-ui/react";
import { Request } from "@common/testing/types";
import Select from "react-select";
import { RestMethod } from "@common/enums";
import { SectionHeader } from "../utils/Card";
import DataPairEditor from "../utils/DataPairEditor";
import RequestBodyEditor from "./bodyEditor";
import TestScriptEditor from "./testScriptEditor";

interface RequestEditorProps extends StackProps {
  request: Request;
  updateRequest: (t: (e: Request) => Request) => void;
}

const RequestEditor: React.FC<RequestEditorProps> = React.memo(
  ({ request, updateRequest, ...props }) => {
    return (
      <VStack {...props}>
        <HStack w="full" spacing="0" px="4" pb="2">
          <Box w="36">
            <Select
              id="test-request-method-selector"
              instanceId="test-request-method-selector"
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: "blue",
                }),
                menu: (provided, state) => ({
                  ...provided,
                  backgroundColor: "blue",
                }),
                valueContainer: (provided, state) => ({
                  ...provided,
                  height: "38px",
                  borderColor: "rgb(222, 228, 237)",
                }),
                container: (provided, state) => ({
                  ...provided,
                  borderColor: "rgb(222, 228, 237)",
                }),
              }}
              options={Object.entries(RestMethod).map((e) => ({
                value: e[1],
                label: e[1],
              }))}
              value={{
                value: request.method,
                label: request.method,
              }}
            />
          </Box>
          <Input
            placeholder="URL"
            rounded="none"
            bg="secondaryBG"
            flexGrow="1"
          />
          <Button colorScheme="blue" px="8" roundedLeft="none">
            Send
          </Button>
        </HStack>
        <Tabs w="full" flexGrow="1">
          <TabList borderBottom="none">
            <Tab>
              <SectionHeader text="Params" />
            </Tab>
            {/*
            <Tab>
              <SectionHeader text="Authorization" />
            </Tab>
              */}
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
          <TabPanels flexGrow="1" h="full" overflow="hidden">
            <TabPanel h="full" p="0">
              <DataPairEditor
                title="Query Params"
                pairs={request.params}
                updatePairs={(t) =>
                  updateRequest((e) => ({ ...e, params: t(e.params) }))
                }
                py="4"
              />
            </TabPanel>
            {/*
            <TabPanel p="0"></TabPanel>
            */}
            <TabPanel h="full" p="0">
              <DataPairEditor
                title="Headers"
                pairs={request.headers}
                updatePairs={(t) =>
                  updateRequest((e) => ({ ...e, headers: t(e.headers) }))
                }
                py="4"
              />
            </TabPanel>
            <TabPanel h="full" p="0">
              <RequestBodyEditor
                body={request.body}
                updateBody={(t) =>
                  updateRequest((e) => ({ ...e, body: t(e.body) }))
                }
              />
            </TabPanel>
            <TabPanel h="full" p="0">
              <TestScriptEditor
                testScript={request.tests}
                updateTestScript={(t) =>
                  updateRequest((e) => ({ ...e, tests: t(e.tests) }))
                }
                py="4"
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    );
  }
);

export default RequestEditor;
