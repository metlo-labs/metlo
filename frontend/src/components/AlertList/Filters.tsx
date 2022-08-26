import React from "react"
import { Stack, Box, Text } from "@chakra-ui/react"
import { Select } from "chakra-react-select"
import { GetAlertParams } from "@common/types"
import { AlertType, RiskScore } from "@common/enums"

interface AlertFilterProps {
  alert?: string
  riskScore?: string
  alertList: string[]
  riskList: string[]
  params: GetAlertParams
  setParams: React.Dispatch<React.SetStateAction<GetAlertParams>>
}

const FilterHeader: React.FC<{ title: string }> = React.memo(({ title }) => (
  <Text fontWeight="semibold" mb="2" fontSize="sm">
    {title}
  </Text>
))

const AlertFilters: React.FC<AlertFilterProps> = React.memo(
  ({ alert, alertList, riskScore, riskList, params, setParams }) => {
    return (
      <Stack direction={{ base: "column", lg: "row" }} spacing="4" w="full">
        <Box w="xs">
          <FilterHeader title="Alert Type" />
          <Select
            value={
              alert && {
                label: alert,
                value: alert,
              }
            }
            isMulti={true}
            size="sm"
            options={alertList.map(e => ({
              label: e,
              value: e,
            }))}
            placeholder="Filter by alert type..."
            instanceId="alert-tbl-env-alert"
            onChange={e =>
              setParams({
                ...params,
                alertTypes: e.map(alert => alert.label as AlertType),
              })
            }
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
            options={riskList.map(e => ({
              label: e,
              value: e,
            }))}
            placeholder="Filter by risk..."
            instanceId="alert-tbl-env-risk"
            onChange={e =>
              setParams({
                ...params,
                riskScores: e.map(riskScore => riskScore.label as RiskScore),
              })
            }
          />
        </Box>
      </Stack>
    )
  },
)

export default AlertFilters
