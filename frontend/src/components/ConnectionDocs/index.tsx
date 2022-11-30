import React from "react"
import {
  Box,
  VStack,
  HStack,
  Image,
  useColorMode,
  TabPanel,
  Tab,
  Tabs,
  TabList,
  TabPanels,
} from "@chakra-ui/react"
import { ConnectionType } from "@common/enums"
import AWSdocs from "./docs/aws"
import GCPDocs from "./docs/gcp"
import PythonDocs from "./docs/python"
import NodeDocs from "./docs/node"
import JavaDocs from "./docs/java"
import KubernetesDocs from "./docs/kubernetes"
import GoDocs from "./docs/go"

interface ConnectionDocsListProps {}

const ConnectionDocsList: React.FC<ConnectionDocsListProps> = React.memo(() => {
  const colorMode = useColorMode()

  const host = "http://<YOUR_METLO_HOST>:8081"
  const apiKey = "<YOUR_METLO_API_KEY>"

  return (
    <VStack spacing={12} w={"full"}>
      <VStack spacing={6} w={"full"}>
        <Tabs w={"full"}>
          <TabList w={"full"}>
            <Tab>
              <HStack>
                <Box>
                  <Image
                    alt={`AWS-image`}
                    boxSize={"20px"}
                    src={`/static-images/connections/${ConnectionType.AWS}_${colorMode.colorMode}.svg`}
                  />
                </Box>
                <Box display={{ base: "none", lg: "block" }}>AWS</Box>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <Box>
                  <Image
                    alt={`GCP-image`}
                    boxSize={"20px"}
                    src={`/static-images/connections/${ConnectionType.GCP}_${colorMode.colorMode}.svg`}
                  />
                </Box>
                <Box display={{ base: "none", lg: "block" }}>GCP</Box>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <Box>
                  <Image
                    alt={`Python-image`}
                    boxSize={"20px"}
                    src={`/static-images/connections/${ConnectionType.PYTHON}_${colorMode.colorMode}.svg`}
                  />
                </Box>
                <Box display={{ base: "none", lg: "block" }}>Python</Box>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <Box>
                  <Image
                    alt={`Node-image`}
                    boxSize={"25px"}
                    src={`/static-images/connections/${ConnectionType.NODE}_${colorMode.colorMode}.svg`}
                  />
                </Box>
                <Box display={{ base: "none", lg: "block" }}>NodeJS</Box>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <Box>
                  <Image
                    alt={`Java-image`}
                    boxSize={"25px"}
                    src={`/static-images/connections/${ConnectionType.JAVA}_${colorMode.colorMode}.svg`}
                  />
                </Box>
                <Box display={{ base: "none", lg: "block" }}>Java</Box>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <Box>
                  <Image
                    alt={`Go-image`}
                    boxSize={"25px"}
                    src={`/static-images/connections/${ConnectionType.GOLANG}_${colorMode.colorMode}.svg`}
                  />
                </Box>
                <Box display={{ base: "none", lg: "block" }}>Go</Box>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <Box>
                  <Image
                    alt={`Python-image`}
                    boxSize={"20px"}
                    src={`/static-images/connections/${ConnectionType.KUBERNETES}_${colorMode.colorMode}.svg`}
                  />
                </Box>
                <Box display={{ base: "none", lg: "block" }}>Kubernetes</Box>
              </HStack>
            </Tab>
          </TabList>
          <TabPanels paddingInline={0}>
            <TabPanel>
              <AWSdocs host={host} apiKey={apiKey} />
            </TabPanel>
            <TabPanel>
              <GCPDocs host={host} apiKey={apiKey} />
            </TabPanel>
            <TabPanel>
              <PythonDocs host={host} apiKey={apiKey} />
            </TabPanel>
            <TabPanel>
              <NodeDocs host={host} apiKey={apiKey} />
            </TabPanel>
            <TabPanel>
              <JavaDocs host={host} apiKey={apiKey} />
            </TabPanel>
            <TabPanel>
              <GoDocs host={host} apiKey={apiKey} />
            </TabPanel>
            <TabPanel>
              <KubernetesDocs />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </VStack>
  )
})

export default ConnectionDocsList
