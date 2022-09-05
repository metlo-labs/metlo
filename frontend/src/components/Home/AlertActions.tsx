import React from "react"
import Link from "next/link"
import {
  Button,
  StackProps,
  HStack,
  StackDivider,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react"
import { AlertType } from "@common/enums"

interface AlertActionsProps extends StackProps {
  totalAlerts: number
  alertTypeCount: Map<AlertType, number>
}

interface AlertAction {
  alertTypeCount: Map<AlertType, number>
  description: string
  alertTypes: AlertType[]
}

const Action: React.FC<AlertAction> = React.memo(
  ({ alertTypeCount, alertTypes, description }) => {
    return (
      <HStack spacing="8">
        <Text fontSize="xl" fontWeight="semibold" w="8">
          {alertTypes.map(e => alertTypeCount[e] || 0).reduce((a, b) => a + b)}
        </Text>
        <VStack alignItems="flex-start">
          <Text fontSize="md" fontWeight="medium">
            {description}
          </Text>
          <Link href={encodeURI(`/alerts?alertTypes=${alertTypes.join(",")}`)}>
            <a>View Alerts →</a>
          </Link>
        </VStack>
      </HStack>
    )
  },
)

const AlertActions: React.FC<AlertActionsProps> = React.memo(
  ({ totalAlerts, alertTypeCount, ...props }) => {
    return (
      <VStack
        borderWidth="1px"
        rounded="md"
        overflow="hidden"
        py="4"
        alignItems="flex-start"
        spacing="2"
        divider={<StackDivider />}
        bg="cellBG"
        {...props}
      >
        <Heading px="4" size="md" color="gray.800">
          Action Items
        </Heading>
        <HStack px="8" pt="2" spacing="20" h="full" w="full">
          <VStack>
            <Text fontSize="2xl" fontWeight="semibold">
              {totalAlerts}
            </Text>
            <Text fontSize="md" fontWeight="medium" pb="2">
              Total Unresolved Alerts
            </Text>
            <Link href={encodeURI(`/alerts`)}>
              <Button>View All Alerts →</Button>
            </Link>
          </VStack>
          <VStack alignItems="flex-start" spacing="6">
            <Action
              alertTypeCount={alertTypeCount}
              alertTypes={[AlertType.NEW_ENDPOINT]}
              description="Unidentified Endpoints"
            />
            <Action
              alertTypeCount={alertTypeCount}
              alertTypes={[AlertType.OPEN_API_SPEC_DIFF]}
              description="OpenAPI Spec Diffs Detected"
            />
            <Action
              alertTypeCount={alertTypeCount}
              alertTypes={[AlertType.PII_DATA_DETECTED]}
              description="PII Data Fields Detected"
            />
          </VStack>
        </HStack>
      </VStack>
    )
  },
)

export default AlertActions
