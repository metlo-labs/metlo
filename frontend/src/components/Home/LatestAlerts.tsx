import React from "react"
import Link from "next/link"
import {
  Heading,
  HStack,
  StackDivider,
  StackProps,
  VStack,
  Text,
  Icon,
} from "@chakra-ui/react"
import { Alert } from "@common/types"
import { alertTypeToIcon } from "components/Alert/utils"
import EmptyView from "components/utils/EmptyView"

interface LatestAlertsProps extends StackProps {
  alerts: Alert[]
}

const AlertItem: React.FC<{ alertItem: Alert }> = React.memo(
  ({ alertItem }) => {
    return (
      <Link
        href={`/endpoint/${alertItem.apiEndpointUuid}?tab=alerts&uuid=${alertItem.uuid}`}
        legacyBehavior
      >
        <HStack
          py="2"
          px="4"
          cursor="pointer"
          _hover={{ bg: "gray.50" }}
          w="full"
        >
          <Icon as={alertTypeToIcon(alertItem.type)} boxSize="20px" />
          <VStack alignItems="flex-start" spacing="1">
            <Text>{alertItem.type}</Text>
            <HStack>
              <Text fontSize="sm">{alertItem.apiEndpoint.host}</Text>
              <Text fontSize="sm">{alertItem.apiEndpoint.path}</Text>
            </HStack>
          </VStack>
        </HStack>
      </Link>
    )
  },
)

const LatestAlerts: React.FC<LatestAlertsProps> = React.memo(
  ({ alerts, ...props }) => {
    return (
      <VStack
        borderWidth="1px"
        rounded="md"
        overflow="hidden"
        pt="4"
        alignItems="flex-start"
        spacing="0"
        bg="cellBG"
        divider={<StackDivider />}
        {...props}
      >
        <HStack
          alignItems="center"
          justifyContent="space-between"
          w="full"
          px="4"
          pb="2"
        >
          <Heading size="md" color="gray.800">
            Latest Alerts
          </Heading>
          <Link href="/alerts">
            View All Alerts →
          </Link>
        </HStack>
        {alerts.length === 0 ? (
          <EmptyView text="No New Alerts." />
        ) : (
          <VStack
            alignItems="flex-start"
            pb="2"
            overflow="auto"
            w="full"
            spacing="0"
            divider={<StackDivider />}
          >
            {alerts.map(e => (
              <AlertItem alertItem={e} key={e.uuid}></AlertItem>
            ))}
          </VStack>
        )}
      </VStack>
    )
  },
)

export default LatestAlerts
