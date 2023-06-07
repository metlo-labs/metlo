import React, { useState } from "react"
import { Box, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react"
import { Select } from "chakra-react-select"
import moment from "moment"
import "react-dates/initialize"
import { DateRangePicker, FocusedInputShape } from "react-dates"
import { GetNewDetectionsParams } from "@common/api/endpoint"
import { NewDetectionType, RiskScore } from "@common/enums"

import "react-dates/lib/css/_datepicker.css"

interface NewDetectionFilterProps {
  hostList: string[]
  riskList: string[]
  params: GetNewDetectionsParams
  setParams: (newParams: GetNewDetectionsParams) => void
}

const DETECTION_TYPE_TO_LABEL: Record<NewDetectionType, string> = {
  [NewDetectionType.ENDPOINT]: "Endpoint",
  [NewDetectionType.DATA_FIELD]: "Data Field",
}

const FilterHeader: React.FC<{ title: string }> = React.memo(({ title }) => (
  <Text fontWeight="semibold" mb="1" fontSize="sm">
    {title}
  </Text>
))

export const NewDetectionFilters: React.FC<NewDetectionFilterProps> =
  React.memo(({ hostList, riskList, params, setParams }) => {
    const [focusedInput, setFocusedInput] = useState<FocusedInputShape | null>(
      null,
    )
    return (
      <VStack spacing="4" w="full">
        <Wrap overflow="visible" w="full" spacing={{ base: 2, md: 4 }}>
          <WrapItem w="286px">
            <Box w="full" h="full">
              <FilterHeader title="Time Range" />
              <DateRangePicker
                startDate={moment(params.start).local().startOf("day")}
                readOnly={false}
                startDateId="start-date"
                endDate={moment(params.end).local().endOf("day")}
                endDateId="end-date"
                onDatesChange={e =>
                  e.startDate &&
                  e.endDate &&
                  setParams({
                    start: e.startDate.local().startOf("day").toISOString(),
                    end: e.endDate.local().endOf("day").toISOString(),
                    detectionOffset: 0,
                  })
                }
                focusedInput={focusedInput}
                onFocusChange={e => setFocusedInput(e)}
                isOutsideRange={() => false}
              />
            </Box>
          </WrapItem>
          <WrapItem w={{ base: "full", sm: "150px" }}>
            <Box w="full">
              <FilterHeader title="Type" />
              <Select
                className="chakra-react-select"
                value={
                  params && {
                    label: DETECTION_TYPE_TO_LABEL[params.detectionType],
                    value: params.detectionType,
                  }
                }
                isMulti={false}
                size="sm"
                options={Object.values(NewDetectionType).map(e => ({
                  label: DETECTION_TYPE_TO_LABEL[e],
                  value: e,
                }))}
                instanceId="detection-tbl-env-type"
                onChange={e =>
                  setParams({
                    detectionType: e.value as NewDetectionType,
                    detectionOffset: 0,
                  })
                }
              />
            </Box>
          </WrapItem>
          <WrapItem w={{ base: "full", sm: "xs" }}>
            <Box w="full">
              <FilterHeader title="Risk Score" />
              <Select
                className="chakra-react-select"
                value={
                  params &&
                  params?.detectionRiskScores?.map(risk => ({
                    label: risk as string,
                    value: risk as string,
                  }))
                }
                isMulti={true}
                size="sm"
                options={riskList.map(e => ({
                  label: e,
                  value: e,
                }))}
                placeholder="Filter by risk..."
                instanceId="detection-tbl-env-risk"
                onChange={e =>
                  setParams({
                    detectionRiskScores: e.map(
                      riskScore => riskScore.label as RiskScore,
                    ),
                    detectionOffset: 0,
                  })
                }
              />
            </Box>
          </WrapItem>
          <WrapItem w={{ base: "full", sm: "sm" }}>
            <Box w="full">
              <FilterHeader title="Host" />
              <Select
                className="chakra-react-select"
                value={
                  params &&
                  params?.detectionHosts?.map(host => ({
                    label: host,
                    value: host,
                  }))
                }
                isMulti={true}
                size="sm"
                options={hostList.map(e => ({
                  label: e,
                  value: e,
                }))}
                placeholder="Filter by host..."
                instanceId="detection-tbl-env-host"
                onChange={e =>
                  setParams({
                    detectionHosts: e.map(host => host.label),
                    detectionOffset: 0,
                  })
                }
              />
            </Box>
          </WrapItem>
        </Wrap>
      </VStack>
    )
  })
