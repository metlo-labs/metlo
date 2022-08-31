import React, { useState } from "react"
import {
  VStack,
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react"
import { Request } from "@common/testing/types"
import { SectionHeader } from "../utils/Card"
import DataPairEditor from "../utils/DataPairEditor"
import RequestBodyEditor from "./bodyEditor"
import TestScriptEditor from "./testScriptEditor"
import Response from "./responseViewer"
import AuthSwitch from "../Authentication/authSwitch"
import { AuthType } from "@common/testing/enums"
import SplitPane from "react-split-pane"
import URLHeader from "./urlHeader"

interface RequestEditorProps {
  request: Request
  sendSelectedRequest: () => void
  fetching: boolean
  updateRequest: (t: (e: Request) => Request) => void
}

const RequestEditor: React.FC<RequestEditorProps> = React.memo(
  ({ request, fetching, sendSelectedRequest, updateRequest }) => {
    const [authType, setAuthType] = useState<AuthType>(AuthType.NO_AUTH)
    return (
      <Box flexGrow="1" h="full">
        <Box w="full" height="full" position="relative">
          {/* @ts-ignore */}
          <SplitPane
            split="horizontal"
            minSize="0"
            defaultSize="50%"
            paneStyle={{ overflow: "hidden" }}
          >
            <VStack w="full" spacing="0">
              <URLHeader
                method={request.method}
                url={request.url}
                fetching={fetching}
                sendSelectedRequest={sendSelectedRequest}
                updateRequest={updateRequest}
              />
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
                      updatePairs={t =>
                        updateRequest(e => ({ ...e, params: t(e.params) }))
                      }
                    />
                  </TabPanel>
                  <TabPanel p="0" h="full">
                    <AuthSwitch
                      variant={authType}
                      setVariant={setAuthType}
                      setRequest={updateRequest}
                    />
                  </TabPanel>
                  <TabPanel p="0" h="full">
                    <DataPairEditor
                      title="Headers"
                      pairs={request.headers}
                      updatePairs={t =>
                        updateRequest(e => ({ ...e, headers: t(e.headers) }))
                      }
                    />
                  </TabPanel>
                  <TabPanel p="0" h="full">
                    <RequestBodyEditor
                      body={request.body}
                      updateBody={t =>
                        updateRequest(e => ({ ...e, body: t(e.body) }))
                      }
                    />
                  </TabPanel>
                  <TabPanel p="0" h="full">
                    <TestScriptEditor
                      testScript={request.tests}
                      updateTestScript={t =>
                        updateRequest(e => ({ ...e, tests: t(e.tests) }))
                      }
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </VStack>
            <Response res={request.result} />
          </SplitPane>
        </Box>
      </Box>
    )
  },
)

export default RequestEditor
