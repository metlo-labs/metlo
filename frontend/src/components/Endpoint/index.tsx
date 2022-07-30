import React from "react";
import { BiInfoCircle } from "@react-icons/all-files/bi/BiInfoCircle";
import { BsFillLockFill } from "@react-icons/all-files/bs/BsFillLockFill";
import { FaBell } from "@react-icons/all-files/fa/FaBell";
import { Badge, Code, GridItem, HStack, VStack } from "@chakra-ui/react";
import { Endpoint } from "../../types";
import { CardWithHeader } from "../utils/Card";
import { METHOD_TO_COLOR } from "../../constants";

interface EndpointPageProps {
  endpoint: Endpoint;
}

const EndpointPage: React.FC<EndpointPageProps> = React.memo(({ endpoint }) => {
  return (
    <VStack w="full" alignItems="flex-start" spacing="8">
      <HStack spacing="4">
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
          <GridItem w="100%" h="10" bg="blue.500" />
          <GridItem w="100%" h="10" bg="blue.500" />
          <GridItem w="100%" h="10" bg="blue.500" colSpan={2} />
        </CardWithHeader>
        <CardWithHeader title="PII Fields" sym={BsFillLockFill}>
          <GridItem w="100%" h="10" bg="blue.500" />
          <GridItem w="100%" h="10" bg="blue.500" />
        </CardWithHeader>
        <CardWithHeader title="Alerts" sym={FaBell}>
          <GridItem w="100%" h="10" bg="blue.500" />
          <GridItem w="100%" h="10" bg="blue.500" />
        </CardWithHeader>
      </VStack>
    </VStack>
  );
});

export default EndpointPage;
