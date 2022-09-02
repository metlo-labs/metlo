import React from "react"
import { VStack, Text, HStack, StackDivider } from "@chakra-ui/react"

interface SummaryStatsProps {
  hostCount: number
  numHighRiskAlerts: number
  numAlerts: number
  numEndpoints: number
  numPIIDataDetected: number
}

const SummaryStatValue: React.FC<{ value: number; title: string }> = React.memo(
  ({ value, title }) => (
    <VStack bg="cellBG" py="4" spacing="1" w="20%">
      <Text fontSize="xl" fontWeight="semibold" rounded="md">
        {value}
      </Text>
      <Text fontSize="sm" fontWeight="medium">
        {title}
      </Text>
    </VStack>
  ),
)

const SummaryStats: React.FC<SummaryStatsProps> = React.memo(
  ({ hostCount, numHighRiskAlerts, numAlerts, numEndpoints, numPIIDataDetected }) => {
    return (
      <HStack
        w="full"
        spacing="0"
        borderWidth="1px"
        divider={<StackDivider />}
        rounded="md"
        overflow="hidden"
      >
        <SummaryStatValue value={hostCount} title="Hosts" />
        <SummaryStatValue value={numHighRiskAlerts} title="High Risk Alerts" />
        <SummaryStatValue value={numAlerts} title="New Alerts" />
        <SummaryStatValue value={numEndpoints} title="Endpoints Tracked" />
        <SummaryStatValue value={numPIIDataDetected} title="PII Data Fields" />
      </HStack>
    )
  },
)

export default SummaryStats
