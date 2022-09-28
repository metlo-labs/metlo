import React from "react"
import { Text, Stack, Box } from "@chakra-ui/react"
import { Select } from "chakra-react-select"
import { GetAttackParams } from "@common/types"
import { RiskScore } from "@common/enums"

interface AttackFilterProps {
  hosts?: string[]
  riskScores?: string[]
  hostList: string[]
  setParams: (t: (params: GetAttackParams) => GetAttackParams) => void
}

const FilterHeader: React.FC<{ title: string }> = React.memo(({ title }) => (
  <Text fontWeight="semibold" mb="2" fontSize="sm">
    {title}
  </Text>
))

export const AttackFilters: React.FC<AttackFilterProps> = React.memo(
  ({ hosts, riskScores, hostList, setParams }) => {
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
            instanceId="attack-tbl-env-host"
            onChange={e =>
              setParams(params => ({
                ...params,
                hosts: e.map(host => host.label),
                offset: 0,
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
            instanceId="attack-tbl-env-risk"
            onChange={e =>
              setParams(params => ({
                ...params,
                riskScores: e.map(riskScore => riskScore.label as RiskScore),
                offset: 0,
              }))
            }
          />
        </Box>
      </Stack>
    )
  },
)
