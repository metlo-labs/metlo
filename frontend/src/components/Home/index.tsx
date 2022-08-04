import React from "react";
import { Heading, VStack } from "@chakra-ui/react";
import SummaryStats from "./SummaryStats";
import AlertList from "components/Endpoint/AlertList";
import { Alert } from "@common/types";

interface HomePageProps {
  numAlerts: number;
  numEndpoints: number;
  numPIIDataDetected: number;
  alerts: Alert[];
}

const HomePage: React.FC<HomePageProps> = React.memo(
  ({ numAlerts, numEndpoints, numPIIDataDetected, alerts }) => {
    return (
      <VStack w="full" alignItems="flex-start">
        <SummaryStats
          numAlerts={numAlerts}
          numEndpoints={numEndpoints}
          numPIIDataDetected={numPIIDataDetected}
        />
        <Heading fontSize="xl">Alerts</Heading>
        <AlertList alerts={alerts} />
      </VStack>
    );
  }
);

export default HomePage;
