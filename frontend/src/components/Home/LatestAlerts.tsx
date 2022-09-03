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
      <HStack px="4">
        <Icon as={alertTypeToIcon(alertItem.type)} boxSize="20px" />
        <VStack alignItems="flex-start" spacing="1">
          <Text>{alertItem.type}</Text>
          <HStack>
            <Text fontSize="sm">{alertItem.apiEndpoint.host}</Text>
            <Text fontSize="sm">{alertItem.apiEndpoint.path}</Text>
          </HStack>
        </VStack>
      </HStack>
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
        bg="cellBg"
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
            <a>View All Alerts →</a>
          </Link>
        </HStack>
        {alerts.length === 0 ? (
          <EmptyView text="No New Alerts." />
        ) : (
          <VStack
            alignItems="flex-start"
            py="2"
            overflow="auto"
            w="full"
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
