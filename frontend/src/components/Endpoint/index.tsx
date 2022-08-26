import React from "react"
import NextLink from "next/link"
import { BiInfoCircle } from "@react-icons/all-files/bi/BiInfoCircle"
import { BsFillLockFill } from "@react-icons/all-files/bs/BsFillLockFill"
import { GrStackOverflow } from "@react-icons/all-files/gr/GrStackOverflow"
import { TiFlowSwitch } from "@react-icons/all-files/ti/TiFlowSwitch"
import { FaBell } from "@react-icons/all-files/fa/FaBell"
import { BiTestTube } from "@react-icons/all-files/bi/BiTestTube"
import {
  Badge,
  Code,
  HStack,
  VStack,
  Text,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react"
import { useRouter } from "next/router"
import { SectionHeader } from "components/utils/Card"
import { ApiEndpointDetailed, Usage } from "@common/types"
import { METHOD_TO_COLOR } from "~/constants"
import DataFieldList from "./DataFieldList"
import TraceList from "./TraceList"
import AlertList from "./AlertList"
import EndpointOverview from "./Overview"
import TestList from "./TestList"

interface EndpointPageProps {
  endpoint: ApiEndpointDetailed
  usage: Usage[]
}

const EndpointPage: React.FC<EndpointPageProps> = React.memo(
  ({ endpoint, usage }) => {
    const router = useRouter()
    const headerColor = useColorModeValue(
      "rgb(179, 181, 185)",
      "rgb(91, 94, 109)",
    )
    const { tab, uuid } = router.query
    const getDefaultTab = () => {
      switch (tab) {
        case "overview":
          return 0
        case "fields":
          return 1
        case "traces":
          return 2
        case "alerts":
          return 3
        case "tests":
          return 4
        default:
          return 0
      }
    }

    return (
      <VStack
        w="full"
        alignItems="flex-start"
        spacing="0"
        h="100vh"
        overflow="hidden"
      >
        <VStack alignItems="flex-start" pt="6" px="6">
          <NextLink href="/endpoints">
            <HStack color={headerColor} spacing="1" cursor="pointer">
              <TiFlowSwitch />
              <Text fontWeight="semibold">Endpoints</Text>
            </HStack>
          </NextLink>
          <HStack spacing="4" pb="6">
            <Badge
              fontSize="xl"
              px="2"
              py="1"
              colorScheme={METHOD_TO_COLOR[endpoint?.method] || "gray"}
            >
              {endpoint?.method.toUpperCase()}
            </Badge>
            <Code fontSize="xl" fontWeight="semibold" p="1">
              {endpoint.path}
            </Code>
          </HStack>
        </VStack>
        <Tabs
          w="full"
          display="flex"
          flexDir="column"
          flexGrow="1"
          defaultIndex={getDefaultTab()}
          overflow="hidden"
        >
          <TabList>
            <Tab>
              <SectionHeader text="Overview" sym={BiInfoCircle} />
            </Tab>
            <Tab>
              <SectionHeader text="Detected Fields" sym={BsFillLockFill} />
            </Tab>
            <Tab>
              <SectionHeader text="Traces" sym={GrStackOverflow} />
            </Tab>
            <Tab>
              <SectionHeader text="Alerts" sym={FaBell} />
            </Tab>
            <Tab>
              <SectionHeader text="Tests" sym={BiTestTube} />
            </Tab>
          </TabList>
          <TabPanels flexGrow="1" h="full" overflow="hidden">
            <TabPanel p="0" overflow="auto" h="full">
              <EndpointOverview endpoint={endpoint} usage={usage} />
            </TabPanel>
            <TabPanel p="0" h="full">
              <DataFieldList
                dataFields={endpoint.dataFields}
                uuid={uuid as string}
              />
            </TabPanel>
            <TabPanel p="0" h="full">
              <TraceList traces={endpoint.traces} uuid={uuid as string} />
            </TabPanel>
            <TabPanel p="0" h="full">
              <AlertList
                alerts={endpoint.alerts}
                method={endpoint.method}
                path={endpoint.path}
                uuid={uuid as string}
                endpointPage
              />
            </TabPanel>
            <TabPanel p="0" h="full">
              <TestList endpoint={endpoint} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    )
  },
)

export default EndpointPage
