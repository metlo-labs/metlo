import React from "react"
import { Box, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react"
import { Select } from "chakra-react-select"
import DatePicker from "react-datepicker"
import { GetNewDetectionsParams } from "@common/api/endpoint"
import { NewDetectionType, RiskScore } from "@common/enums"

import "react-datepicker/dist/react-datepicker.css"

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
    return (
      <VStack spacing="4" w="full">
        <Wrap overflow="visible" w="full" spacing={{ base: 2, md: 4 }}>
          <WrapItem w={{ base: "48%", sm: "3xs" }}>
            <Box w="full">
              <FilterHeader title="Start" />
              <Box borderWidth={1} h="32px" p="1" rounded="md">
                <DatePicker
                  selected={params.start ? new Date(params.start) : null}
                  onChange={e =>
                    setParams({
                      start: e?.toISOString() || null,
                      detectionOffset: 0,
                    })
                  }
                />
              </Box>
            </Box>
          </WrapItem>
          <WrapItem w={{ base: "48%", sm: "3xs" }}>
            <Box w="full">
              <FilterHeader title="End" />
              <Box borderWidth={1} h="32px" p="1" rounded="md">
                <DatePicker
                  selected={params.end ? new Date(params.end) : null}
                  onChange={e =>
                    setParams({
                      end: e?.toISOString() || null,
                      detectionOffset: 0,
                    })
                  }
                />
              </Box>
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
                placeholder="Filter by risk..."
                instanceId="endpoint-tbl-env-risk"
                onChange={e =>
                  setParams({
                    detectionType: e.value as NewDetectionType,
                    detectionOffset: 0,
                  })
                }
              />
            </Box>
          </WrapItem>
          {params.detectionType === NewDetectionType.ENDPOINT ? (
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
                  instanceId="endpoint-tbl-env-risk"
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
          ) : null}
          <WrapItem w={{ base: "full", sm: "lg" }}>
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
                instanceId="endpoint-tbl-env-host"
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
