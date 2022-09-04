import React from "react"
import { Stack, Box, Text } from "@chakra-ui/react"
import { Select } from "chakra-react-select"
import { GetSensitiveDataAggParams } from "@common/types"
import { DataSection, RiskScore } from "@common/enums"
import { DATA_SECTION_TO_LABEL_MAP } from "@common/maps"

interface SensitiveDataFilterProps {
  hosts?: string[]
  riskScores?: string[]
  locations?: DataSection[]
  hostList: string[]
  setParams: (
    t: (params: GetSensitiveDataAggParams) => GetSensitiveDataAggParams,
  ) => void
}

const FilterHeader: React.FC<{ title: string }> = React.memo(({ title }) => (
  <Text fontWeight="semibold" mb="2" fontSize="sm">
    {title}
  </Text>
))

const SensitiveDataFilters: React.FC<SensitiveDataFilterProps> = React.memo(
  ({ hosts, riskScores, locations, hostList, setParams }) => {
    return (
      <Stack direction={{ base: "column", lg: "row" }} spacing="4" w="full">
        <Box w="xs">
          <FilterHeader title="Host" />
          <Select
            value={
              hosts
                ? hosts.map(host => ({
                    label: host,
                    value: host,
                  }))
                : undefined
            }
            isMulti={true}
            size="sm"
            options={hostList.map(e => ({
              label: e,
              value: e,
            }))}
            placeholder="Filter by host..."
            instanceId="sensitive-data-tbl-env-host"
            onChange={e =>
              setParams(params => ({
                ...params,
                hosts: e.map(host => host.label),
              }))
            }
          />
        </Box>
        <Box w="xs">
          <FilterHeader title="Risk Score" />
          <Select
            value={
              riskScores
                ? riskScores.map(riskScore => ({
                    label: riskScore,
                    value: riskScore,
                  }))
                : undefined
            }
            isMulti={true}
            size="sm"
            options={Object.values(RiskScore).map(e => ({
              label: e,
              value: e,
            }))}
            placeholder="Filter by risk..."
            instanceId="sensitive-data-tbl-env-risk"
            onChange={e =>
              setParams(params => ({
                ...params,
                riskScores: e.map(riskScore => riskScore.label as RiskScore),
              }))
            }
          />
        </Box>
        <Box w="xs">
          <FilterHeader title="Request Location" />
          <Select
            value={
              locations
                ? locations.map(location => ({
                    label: DATA_SECTION_TO_LABEL_MAP[location],
                    value: location,
                  }))
                : undefined
            }
            isMulti={true}
            size="sm"
            options={Object.values(DataSection).map(e => ({
              label: DATA_SECTION_TO_LABEL_MAP[e],
              value: e,
            }))}
            placeholder="Filter by location..."
            instanceId="sensitive-data-tbl-env-location"
            onChange={e =>
              setParams(params => ({
                ...params,
                locations: e.map(location => location.value as DataSection),
              }))
            }
          />
        </Box>
      </Stack>
    )
  },
)

export default SensitiveDataFilters
