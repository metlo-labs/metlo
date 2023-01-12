import React from "react"
import {
  VStack,
  Text,
  HStack,
  StackDivider,
  Grid,
  Divider,
  GridItem,
} from "@chakra-ui/react"

interface SummaryStatsProps {
  hostCount: number
  numHighRiskAlerts: number
  numAlerts: number
  numEndpoints: number
  numPIIDataDetected: number
}

const SummaryStatValue: React.FC<{ value: number; title: string }> = React.memo(
  ({ value, title }) => (
    <VStack textAlign="center" py="4" spacing="1" w="full" h="full">
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
  ({
    hostCount,
    numHighRiskAlerts,
    numAlerts,
    numEndpoints,
    numPIIDataDetected,
  }) => {
    return (
      <Grid
        w="full"
        templateColumns={{ base: "2fr 2fr", md: "1fr 1fr 1fr 1fr 1fr" }}
        borderWidth="1px"
        rounded="md"
        overflow="hidden"
        bg="cellBG"
      >
        <GridItem borderRightWidth={1} borderBottomWidth={{ base: 1, md: 0 }}>
          <SummaryStatValue value={hostCount} title="Hosts" />
        </GridItem>
        <GridItem borderRightWidth={1} borderBottomWidth={{ base: 1, md: 0 }}>
          <SummaryStatValue
            value={numHighRiskAlerts}
            title="High Risk Alerts"
          />
        </GridItem>
        <GridItem borderRightWidth={1} borderBottomWidth={{ base: 1, md: 0 }}>
          <SummaryStatValue value={numAlerts} title="New Alerts" />
        </GridItem>
        <GridItem borderRightWidth={1} borderBottomWidth={{ base: 1, md: 0 }}>
          <SummaryStatValue value={numEndpoints} title="Endpoints Tracked" />
        </GridItem>
        <GridItem colSpan={{ base: 2, md: "auto" }}>
          <SummaryStatValue
            value={numPIIDataDetected}
            title="PII Data Fields"
          />
        </GridItem>
      </Grid>
    )
  },
)

export default SummaryStats
