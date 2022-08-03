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
  GridItem,
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
import { Endpoint } from "../../types";
import {
  CardWithHeader,
  DataAttribute,
  DataHeading,
  SectionHeader,
} from "../utils/Card";
import { METHOD_TO_COLOR, RISK_TO_COLOR } from "../../constants";
import PIIDataList from "./PIIDataList";
import EndpointUsageChart from "./UsageChart";

interface EndpointPageProps {
  endpoint: Endpoint;
}

const EndpointPage: React.FC<EndpointPageProps> = React.memo(({ endpoint }) => {
  const headerColor = useColorModeValue(
    "rgb(179, 181, 185)",
    "rgb(91, 94, 109)"
  );
  return (
    <VStack w="full" alignItems="flex-start" spacing="2">
      <NextLink href="/endpoints">
        <HStack color={headerColor} spacing="1" cursor="pointer">
          <TiFlowSwitch />
          <Text fontWeight="semibold">Endpoints</Text>
        </HStack>
      </NextLink>
      <HStack spacing="4" pb="8">
        <Badge
          fontSize="xl"
          px="2"
          py="1"
          colorScheme={METHOD_TO_COLOR[endpoint.method] || "gray"}
        >
          {endpoint.method.toUpperCase()}
        </Badge>
        <Code fontSize="xl" fontWeight="semibold" p="1">
          {endpoint.path}
        </Code>
      </HStack>
      <VStack w="full" alignItems="flex-start" spacing="8">
        <CardWithHeader title="Metadata" sym={BiInfoCircle}>
          <GridItem>
            <DataHeading>Host</DataHeading>
            <DataAttribute>{endpoint.host}</DataAttribute>
          </GridItem>
          <GridItem>
            <DataHeading>Environment</DataHeading>
            <DataAttribute>{endpoint.environment}</DataAttribute>
          </GridItem>
          <GridItem>
            <DataHeading>Risk Score</DataHeading>
            <Badge
              p="1"
              fontSize="sm"
              colorScheme={RISK_TO_COLOR[endpoint.riskScore]}
              pointerEvents="none"
            >
              {endpoint.riskScore}
            </Badge>
          </GridItem>
          <GridItem>
            <DataHeading>First Detected</DataHeading>
            <DataAttribute>{endpoint.firstDetected}</DataAttribute>
          </GridItem>
          <GridItem>
            <DataHeading>Last Active</DataHeading>
            <DataAttribute>{endpoint.lastActive}</DataAttribute>
          </GridItem>
          <GridItem w="100%" colSpan={2}>
            <DataHeading>Usage</DataHeading>
            <EndpointUsageChart />
          </GridItem>
        </CardWithHeader>
        <Tabs w="full">
          <TabList>
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
          <TabPanels>
            <TabPanel p="0">
              <Box w="full" borderWidth="2px" borderTopWidth="0px">
                <PIIDataList PIIFields={endpoint.piiData} />
              </Box>
            </TabPanel>
            <TabPanel p="0">
              <Box w="full" borderWidth="2px" borderTopWidth="0px">
                <PIIDataList PIIFields={endpoint.piiData} />
              </Box>
            </TabPanel>
            <TabPanel p="0">
              <Box w="full" borderWidth="2px" borderTopWidth="0px">
                <PIIDataList PIIFields={endpoint.piiData} />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </VStack>
  );
});

export default EndpointPage;
