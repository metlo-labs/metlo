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
import { useRouter } from "next/router"
import { ConnectionType } from "@common/enums"
import AWSdocs from "./docs/aws"
import GCPDocs from "./docs/gcp"
import PythonDocs from "./docs/python"
import NodeDocs from "./docs/node"
import JavaDocs from "./docs/java"
import KubernetesDocs from "./docs/kubernetes"
import GoDocs from "./docs/go"
import { ConnectionTab } from "enums"

interface ConnectionDocsListProps {}

const ConnectionDocsList: React.FC<ConnectionDocsListProps> = React.memo(() => {
  const colorMode = useColorMode()
  const router = useRouter()
  const { tab } = router.query

  const getTab = () => {
    switch (tab) {
      case ConnectionTab.AWS:
        return 0
      case ConnectionTab.GCP:
        return 1
      case ConnectionTab.PYTHON:
        return 2
      case ConnectionTab.NODEJS:
        return 3
      case ConnectionTab.JAVA:
        return 4
      case ConnectionTab.GO:
        return 5
      case ConnectionTab.KUBERNETES:
        return 6
      default:
        return 0
    }
  }

  const handleTabClick = (newTab: ConnectionTab) => {
    let routerParams = {}
    if (newTab) {
      routerParams["query"] = { tab: newTab }
    }
    router.push(routerParams, undefined, { shallow: true })
  }

  const host = "http://<YOUR_METLO_HOST>:8081"
  const apiKey = "<YOUR_METLO_API_KEY>"

  return (
    <VStack spacing={12} w={"full"}>
      <VStack spacing={6} w={"full"}>
        <Tabs w={"full"} index={getTab()}>
          <TabList w={"full"}>
            <Tab onClick={() => handleTabClick(null)}>
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
            <Tab onClick={() => handleTabClick(ConnectionTab.GCP)}>
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
            <Tab onClick={() => handleTabClick(ConnectionTab.PYTHON)}>
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
            <Tab onClick={() => handleTabClick(ConnectionTab.NODEJS)}>
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
            <Tab onClick={() => handleTabClick(ConnectionTab.JAVA)}>
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
            <Tab onClick={() => handleTabClick(ConnectionTab.GO)}>
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
            <Tab onClick={() => handleTabClick(ConnectionTab.KUBERNETES)}>
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
