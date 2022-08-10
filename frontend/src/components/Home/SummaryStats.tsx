import React from "react";
import { VStack, Text, Grid, GridItem } from "@chakra-ui/react";

interface SummaryStatsProps {
  numHighRiskAlerts: number;
  numAlerts: number;
  numEndpoints: number;
  numPIIDataDetected: number;
}

const SummaryStatValue: React.FC<{ value: number; title: string }> = React.memo(
  ({ value, title }) => (
    <VStack bg="cellBG" py="6" rounded="md" spacing="2" borderWidth="1px">
      <Text fontSize="3xl" fontWeight="semibold" rounded="md">
        {value}
      </Text>
      <Text fontSize="lg" fontWeight="medium">
        {title}
      </Text>
    </VStack>
  )
);

const SummaryStats: React.FC<SummaryStatsProps> = React.memo(
  ({ numHighRiskAlerts, numAlerts, numEndpoints, numPIIDataDetected }) => {
    return (
      <Grid
        w="full"
        templateColumns={{ base: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
        gap="4"
      >
        <GridItem w="full">
          <SummaryStatValue
            value={numHighRiskAlerts}
            title="High Risk Alerts"
          />
        </GridItem>
        <GridItem w="full">
          <SummaryStatValue value={numAlerts} title="New Alerts" />
        </GridItem>
        <GridItem w="full">
          <SummaryStatValue value={numEndpoints} title="Endpoints Tracked" />
        </GridItem>
        <GridItem w="full">
          <SummaryStatValue
            value={numPIIDataDetected}
            title="PII Data Fields"
          />
        </GridItem>
      </Grid>
    );
  }
);

export default SummaryStats;
