import React from "react"
import { Stack, VStack } from "@chakra-ui/react"
import SummaryStats from "./SummaryStats"
import { Summary } from "@common/types"
import AggPIIChart from "./AggPIIChart"
import AlertActions from "./AlertActions"
import UsageChart from "./UsageChart"
import LatestAlerts from "./LatestAlerts"
import TopEndpoints from "./TopEndpoints"

interface HomePageProps {
  summary: Summary
}

const HomePage: React.FC<HomePageProps> = React.memo(({ summary }) => {
  return (
    <VStack w="full" alignItems="flex-start" spacing="4">
      <SummaryStats
        hostCount={summary.hostCount}
        numHighRiskAlerts={summary.highRiskAlerts}
        numAlerts={summary.newAlerts}
        numEndpoints={summary.endpointsTracked}
        numPIIDataDetected={summary.piiDataFields}
      />
      <Stack direction={{ base: "column", xl: "row" }} w="full" spacing="4">
        <AlertActions
          totalAlerts={summary.newAlerts}
          alertTypeCount={summary.alertTypeCount}
          w={{ base: "full", xl: "50%" }}
          h="sm"
        />
        <LatestAlerts
          alerts={summary.topAlerts}
          w={{ base: "full", xl: "50%" }}
          h="sm"
        />
      </Stack>
      <Stack direction={{ base: "column", xl: "row" }} w="full" spacing="4">
        <UsageChart
          usageData={summary.usageStats}
          w={{ base: "full", xl: "50%" }}
          h="sm"
        />
        <AggPIIChart
          piiDataTypeCount={summary.piiDataTypeCount}
          w={{ base: "full", xl: "50%" }}
          h="sm"
        />
      </Stack>
      <TopEndpoints
        endpoints={summary.topEndpoints}
        w="full"
        h={summary.topEndpoints.length > 0 ? "2xl" : "unset"}
      />
    </VStack>
  )
})

export default HomePage
