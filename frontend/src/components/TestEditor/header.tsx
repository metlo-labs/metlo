import React from "react";
import NextLink from "next/link";
import { ApiEndpointDetailed } from "@common/types";
import { Badge, Box, Code, HStack, Text } from "@chakra-ui/react";
import { TiFlowSwitch } from "@react-icons/all-files/ti/TiFlowSwitch";
import { FaChevronRight } from "@react-icons/all-files/fa/FaChevronRight";
import { METHOD_TO_COLOR } from "~/constants";

interface TestEditorHeaderProps {
  endpoint: ApiEndpointDetailed;
}

const TestEditorHeader: React.FC<TestEditorHeaderProps> = React.memo(
  ({ endpoint }) => {
    return (
      <HStack>
        <NextLink href="/endpoints">
          <HStack color="headerColor" spacing="1" cursor="pointer">
            <TiFlowSwitch />
            <Text fontWeight="semibold">Endpoints</Text>
          </HStack>
        </NextLink>
        <Box color="headerColor">
          <FaChevronRight />
        </Box>
        <NextLink href={`/endpoint/${endpoint.uuid}?tab=tests`}>
          <HStack spacing="1" cursor="pointer">
            <Badge
              px="2"
              py="1"
              fontSize="sm"
              colorScheme={METHOD_TO_COLOR[endpoint.method] || "gray"}
            >
              {endpoint?.method.toUpperCase()}
            </Badge>
            <Code fontSize="sm" fontWeight="semibold" p="1">
              {endpoint.path}
            </Code>
          </HStack>
        </NextLink>
      </HStack>
    );
  }
);

export default TestEditorHeader;
