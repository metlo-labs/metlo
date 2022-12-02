import React from "react"
import NextLink from "next/link"
import { ApiEndpointDetailed } from "@common/types"
import { Badge, Box, Code, HStack, Text } from "@chakra-ui/react"
import { TiFlowSwitch } from "icons/ti/TiFlowSwitch"
import { FaChevronRight } from "icons/fa/FaChevronRight"
import { METHOD_TO_COLOR } from "~/constants"

interface TestEditorHeaderProps {
  endpoint: ApiEndpointDetailed
}

const TestEditorHeader: React.FC<TestEditorHeaderProps> = React.memo(
  ({ endpoint }) => {
    return (
      <HStack>
        <NextLink href="/endpoints">
          <HStack
            color="headerColor"
            fontSize="sm"
            spacing="1"
            cursor="pointer"
          >
            <TiFlowSwitch />
            <Text fontWeight="semibold">Endpoints</Text>
          </HStack>
        </NextLink>
        <Box color="headerColor">
          <FaChevronRight size="10" />
        </Box>
        <NextLink href={`/endpoint/${endpoint.uuid}?tab=tests`}>
          <HStack spacing="1" cursor="pointer">
            <Badge
              fontSize="xs"
              colorScheme={METHOD_TO_COLOR[endpoint.method] || "gray"}
            >
              {endpoint?.method.toUpperCase()}
            </Badge>
            <Code fontSize="xs" fontWeight="semibold">
              {endpoint.path}
            </Code>
          </HStack>
        </NextLink>
      </HStack>
    )
  },
)

export default TestEditorHeader
