import React from "react";
import NextLink from "next/link";
import { BiInfoCircle } from "@react-icons/all-files/bi/BiInfoCircle";
import { BsFillLockFill } from "@react-icons/all-files/bs/BsFillLockFill";
import { GrStackOverflow } from "@react-icons/all-files/gr/GrStackOverflow";
import { TiFlowSwitch } from "@react-icons/all-files/ti/TiFlowSwitch";
import { FaBell } from "@react-icons/all-files/fa/FaBell";
import {
  Box,
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
} from "@chakra-ui/react";
import { SectionHeader } from "../utils/Card";
import { ApiEndpointDetailed } from "@common/types";
import { METHOD_TO_COLOR } from "../../constants";
import PIIDataList from "./PIIDataList";
import TraceList from "./TraceList";
import AlertList from "./AlertList";
import EndpointOverview from "./Overview";
import EmptyView from "components/utils/EmptyView";

interface EndpointPageProps {
  endpoint: ApiEndpointDetailed;
  fetching: boolean;
}

const EndpointPage: React.FC<EndpointPageProps> = React.memo(({ endpoint, fetching }) => {
  const headerColor = useColorModeValue(
    "rgb(179, 181, 185)",
    "rgb(91, 94, 109)"
  );
  if (fetching) {
    return <EmptyView />
  }
  return (
    <VStack
      w="full"
      alignItems="flex-start"
      spacing="0"
      h={{ base: "unset", lg: "100vh" }}
      overflow={{ base: "unset", lg: "hidden" }}
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
        overflow={{ base: "unset", lg: "hidden" }}
      >
        <TabList>
          <Tab>
            <SectionHeader text="Overview" sym={BiInfoCircle} />
          </Tab>
          <Tab>
            <SectionHeader text="PII Fields" sym={BsFillLockFill} />
          </Tab>
          <Tab>
            <SectionHeader text="Traces" sym={GrStackOverflow} />
          </Tab>
          <Tab>
            <SectionHeader text="Alerts" sym={FaBell} />
          </Tab>
        </TabList>
        <TabPanels flexGrow="1" overflow={{ base: "unset", lg: "hidden" }}>
          <TabPanel p="0" h={{ base: "unset", lg: "full" }}>
            <EndpointOverview endpoint={endpoint} />
          </TabPanel>
          <TabPanel p="0">
            <PIIDataList PIIFields={endpoint.sensitiveDataClasses} />
          </TabPanel>
          <TabPanel p="0">
            <TraceList traces={endpoint.traces} />
          </TabPanel>
          <TabPanel p="0">
            <AlertList alerts={endpoint.alerts} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
});

export default EndpointPage;
