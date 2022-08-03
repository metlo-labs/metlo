import React from "react";
import { VStack } from "@chakra-ui/react";
import SummaryStats from "./SummaryStats";

interface HomePageProps {
  numAlerts: number;
  numEndpoints: number;
  numPIIDataDetected: number;
}

const HomePage: React.FC<HomePageProps> = React.memo(
  ({ numAlerts, numEndpoints, numPIIDataDetected }) => {
    return (
      <VStack>
        <SummaryStats
          numAlerts={numAlerts}
          numEndpoints={numEndpoints}
          numPIIDataDetected={numPIIDataDetected}
        />
      </VStack>
    );
  }
);

export default HomePage;
