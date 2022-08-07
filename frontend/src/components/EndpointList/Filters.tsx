import React from "react";
import { Stack, Box, Text } from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import { GetEndpointParams } from "@common/types";
import { RiskScore } from "@common/enums";

interface EndpointFilterProps {
  environment?: string;
  host?: string;
  riskScore?: string;
  environmentList: string[];
  hostList: string[];
  riskList: string[];
  setParams: React.Dispatch<React.SetStateAction<GetEndpointParams>>;
  params: GetEndpointParams;
}

const FilterHeader: React.FC<{ title: string }> = React.memo(({ title }) => (
  <Text fontWeight="semibold" mb="2" fontSize="sm">
    {title}
  </Text>
));

const EndpointFilters: React.FC<EndpointFilterProps> = React.memo(
  ({ environment, environmentList, host, hostList, riskScore, riskList, setParams, params }) => {
    return (
      <Stack
        direction={{ base: "column", lg: "row" }}
        spacing="4"
        w="full"
      >
        <Box w="xs">
          <FilterHeader title="Environment" />
          <Select
            value={
              environment && {
                label: environment,
                value: environment,
              }
            }
            isMulti={true}
            size="sm"
            options={environmentList.map((e) => ({
              label: e,
              value: e,
            }))}
            placeholder="Filter by environment..."
            instanceId="endpoint-tbl-env-select"
          />
        </Box>
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
            instanceId="endpoint-tbl-env-host"
            onChange={(e) => setParams({...params, hosts: e.map((host) => host.label)})}
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
            instanceId="endpoint-tbl-env-risk"
            onChange={(e) => setParams({...params, riskScores: e.map((riskScore) => riskScore.label as RiskScore)})}
          />
        </Box>
      </Stack>
    );
  }
);

export default EndpointFilters;
