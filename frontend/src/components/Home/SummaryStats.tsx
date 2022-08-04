import React from "react";
import { HStack, VStack, Text } from "@chakra-ui/react";

interface SummaryStatsProps {
  numHighRiskAlerts: number;
  numAlerts: number;
  numEndpoints: number;
  numPIIDataDetected: number;
}

const SummaryStatValue: React.FC<{ value: number; title: string }> = React.memo(
  ({ value, title }) => (
    <VStack
      bg="cellBG"
      w="56"
      py="6"
      rounded="md"
      spacing="2"
      borderWidth="1px"
    >
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
      <HStack spacing="5">
        <SummaryStatValue value={numHighRiskAlerts} title="High Risk Alerts" />
        <SummaryStatValue value={numAlerts} title="New Alerts" />
        <SummaryStatValue value={numEndpoints} title="Endpoints Tracked" />
        <SummaryStatValue value={numPIIDataDetected} title="PII Data Fields" />
      </HStack>
    );
  }
);

export default SummaryStats;
