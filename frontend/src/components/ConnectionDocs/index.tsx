import React, { useState } from "react"
import {
  Box,
  VStack,
  HStack,
  useDisclosure,
  Image,
  useColorMode,
  TabPanel,
  Tab,
  Tabs,
  TabList,
  TabPanels,
  Icon,
} from "@chakra-ui/react"
import { useRouter } from "next/router"
import { ConnectionType } from "@common/enums"
import AWSdocs from "./docs/aws"
import RenderDocModal from "./renderDocModal"
import GCPDocs from "./docs/gcp"
import { FaJava } from "@react-icons/all-files/fa/FaJava"
import PythonDocs from "./docs/python"
import NodeDocs from "./docs/node"
import JavaDocs from "./docs/java"
import KubernetesDocs from "./docs/kubernetes"

interface ConnectionDocsListProps {}

enum docType {
  none = "none",
  aws = "aws",
  gcp = "gcp",
  node = "node",
  python = "python",
  java = "java",
}

const ConnectionDocsList: React.FC<ConnectionDocsListProps> = React.memo(() => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const router = useRouter()
  const colorMode = useColorMode()
  const [displayComponentType, setDisplayComponentType] = useState<docType>(
    docType.none,
  )

  const openWithComponent = (componentType: docType) => {
    setDisplayComponentType(componentType)
    onOpen()
  }

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
                <Box>AWS EC2</Box>
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
                <Box>Google Cloud</Box>
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
                <Box>Python</Box>
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
                <Box>NodeJS</Box>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <Box>
                  <Icon boxSize={"25px"}>
                    <FaJava />
                  </Icon>
                </Box>
                <Box>Java</Box>
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
                <Box>Kubernetes</Box>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels paddingInline={0}>
            <TabPanel>
              <AWSdocs />
            </TabPanel>
            <TabPanel>
              <Box overflow={"hidden"}>
                <GCPDocs />
              </Box>
            </TabPanel>
            <TabPanel>
              <PythonDocs />
            </TabPanel>
            <TabPanel>
              <NodeDocs />
            </TabPanel>
            <TabPanel>
              <JavaDocs />
            </TabPanel>
            <TabPanel>
              <KubernetesDocs />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
      <Box>
        <RenderDocModal
          isOpen={isOpen}
          onClose={onClose}
          type={displayComponentType.toString()}
          renderComponent={function (): React.ReactElement<
            any,
            string | React.JSXElementConstructor<any>
          > {
            if (displayComponentType == docType.aws) {
              return AWSdocs()
            } else if (displayComponentType == docType.gcp) {
              return GCPDocs()
            } else {
              return <>{displayComponentType}</>
            }
          }}
        />
      </Box>
    </VStack>
  )
})

export default ConnectionDocsList
