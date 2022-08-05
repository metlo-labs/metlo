import React from "react";
import { Stack, Box, Text } from "@chakra-ui/react";
import { Select } from "chakra-react-select";

interface AlertFilterProps {
  host?: string;
  riskScore?: string;
  hostList: string[];
  riskList: string[];
}

const FilterHeader: React.FC<{ title: string }> = React.memo(({ title }) => (
  <Text fontWeight="semibold" mb="2" fontSize="sm">
    {title}
  </Text>
));

const AlertFilters: React.FC<AlertFilterProps> = React.memo(
  ({ host, hostList, riskScore, riskList }) => {
    return (
      <Stack direction={{ base: "column", lg: "row" }} spacing="4" w="full">
        <Box w="xs">
          <FilterHeader title="Host" />
          <Select
            value={
              host && {
                label: host,
                value: host,
              }
            }
            isMulti={true}
            size="sm"
            options={hostList.map((e) => ({
              label: e,
              value: e,
            }))}
            placeholder="Filter by host..."
            instanceId="alert-tbl-env-host"
          />
        </Box>
        <Box w="xs">
          <FilterHeader title="Risk Score" />
          <Select
            value={
              riskScore && {
                label: riskScore,
                value: riskScore,
              }
            }
            isMulti={true}
            size="sm"
            options={riskList.map((e) => ({
              label: e,
              value: e,
            }))}
            placeholder="Filter by risk..."
            instanceId="alert-tbl-env-risk"
          />
        </Box>
      </Stack>
    );
  }
);

export default AlertFilters;
