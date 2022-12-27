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
  Icon,
} from "@chakra-ui/react"
import { AlertType } from "@common/enums"
import { alertTypeToIcon } from "components/Alert/utils"

interface AlertActionsProps extends StackProps {
  totalAlerts: number
  alertTypeCount: Map<AlertType, number>
}

interface AlertAction {
  alertTypeCount: Map<AlertType, number>
  description: string
  alertTypes: AlertType[]
}

interface ActionItemProps {
  link: string
  icon: any
  count: number
  description: string
  cta: string
}

const ActionItem: React.FC<ActionItemProps> = React.memo(
  ({ link, icon, count, description, cta }) => {
    let color = "initial"
    if (count === 0) {
      color = "green.600"
    } else {
      color = "orange.400"
    }
    return (
      <Link href={encodeURI(link)} legacyBehavior>
        <HStack
          py="4"
          px="4"
          cursor="pointer"
          _hover={{ bg: "gray.50" }}
          w="full"
          spacing={4}
        >
          <Icon as={icon} boxSize="25px" color={color} />
          <VStack w="full" alignItems="flex-start" spacing="1">
            <HStack w="full" justifyContent="space-between">
              <HStack>
                <Text
                  w="50px"
                  color={color}
                  as="span"
                  fontSize="xl"
                  fontWeight="semibold"
                >
                  {count}
                </Text>{" "}
                <Text fontSize="lg">{description}</Text>
              </HStack>
              <Text fontSize="lg">{cta} →</Text>
            </HStack>
          </VStack>
        </HStack>
      </Link>
    )
  },
)

const Action: React.FC<AlertAction> = React.memo(
  ({ alertTypeCount, alertTypes, description }) => {
    const count = alertTypes
      .map(e => alertTypeCount[e] || 0)
      .reduce((a, b) => a + b)
    const link = `/alerts?alertTypes=${alertTypes.join(",")}`
    const icon = alertTypeToIcon(alertTypes[0])
    return (
      <ActionItem
        link={link}
        icon={icon}
        count={count}
        description={description}
        cta={"View Alerts"}
      />
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
        pt="4"
        alignItems="flex-start"
        spacing={0}
        divider={<StackDivider />}
        bg="cellBG"
        {...props}
      >
        <Heading px="4" pb="2" size="md" color="gray.800">
          Action Items
        </Heading>
        <VStack
          alignItems="flex-start"
          overflow="auto"
          w="full"
          spacing="0"
          pb="2"
          divider={<StackDivider />}
        >
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
      </VStack>
    )
  },
)

export default AlertActions
