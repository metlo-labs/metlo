import React from "react";
import { Box, Heading, VStack } from "@chakra-ui/react";
import SummaryStats from "./SummaryStats";
import AlertList from "components/Endpoint/AlertList";
import { Alert } from "@common/types";

interface HomePageProps {
  numHighRiskAlerts: number;
  numAlerts: number;
  numEndpoints: number;
  numPIIDataDetected: number;
  alerts: Alert[];
}

const HomePage: React.FC<HomePageProps> = React.memo(
  ({
    numHighRiskAlerts,
    numAlerts,
    numEndpoints,
    numPIIDataDetected,
    alerts,
  }) => {
    return (
      <VStack w="full" alignItems="flex-start" spacing="10">
        <SummaryStats
          numHighRiskAlerts={numHighRiskAlerts}
          numAlerts={numAlerts}
          numEndpoints={numEndpoints}
          numPIIDataDetected={numPIIDataDetected}
        />
        <VStack w="full" alignItems="flex-start" spacing="4">
          <Heading fontSize="xl">Top Alerts</Heading>
          <Box w="full" borderWidth="1px">
            <AlertList alerts={alerts} showEndpoint />
          </Box>
        </VStack>
      </VStack>
    );
  }
);

export default HomePage;
