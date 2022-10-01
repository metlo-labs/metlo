import React, { useState } from "react"
import {
  Stack,
  Box,
  Text,
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react"
import { Select } from "chakra-react-select"
import { GoSearch } from "@react-icons/all-files/go/GoSearch"
import { GetEndpointParams } from "@common/types"
import { DataClass, RiskScore } from "@common/enums"
import { useEffect } from "react"
import debounce from "lodash/debounce"

interface EndpointFilterProps {
  hostList: string[]
  riskList: string[]
  dataClassesList: string[]
  params: GetEndpointParams
  setParams: (t: (e: GetEndpointParams) => GetEndpointParams) => void
}

const FilterHeader: React.FC<{ title: string }> = React.memo(({ title }) => (
  <Text fontWeight="semibold" mb="2" fontSize="sm">
    {title}
  </Text>
))

const EndpointFilters: React.FC<EndpointFilterProps> = React.memo(
  ({ hostList, riskList, dataClassesList, params, setParams }) => {
    const setSearchQuery = (val: string) => {
      setParams(oldParams => ({
        ...oldParams,
        searchQuery: val,
        offset: 0,
      }))
    }
    const debounceSearch = debounce(setSearchQuery, 500)

    return (
      <VStack spacing="6">
        <Stack direction={{ base: "column", lg: "row" }} spacing="4" w="full">
          <Box w={{ base: "full", lg: "xs" }} zIndex="1003">
            <FilterHeader title="Host" />
            <Select
              value={
                params &&
                params?.hosts?.map(host => ({ label: host, value: host }))
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
                setParams(oldParams => ({
                  ...oldParams,
                  hosts: e.map(host => host.label),
                  offset: 0,
                }))
              }
            />
          </Box>
          <Box w={{ base: "full", lg: "xs" }} zIndex="1002">
            <FilterHeader title="Risk Score" />
            <Select
              value={
                params &&
                params?.riskScores?.map(risk => ({
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
                setParams(oldParams => ({
                  ...oldParams,
                  riskScores: e.map(riskScore => riskScore.label as RiskScore),
                  offset: 0,
                }))
              }
            />
          </Box>
          <Box w={{ base: "full", lg: "xs" }} zIndex="1001">
            <FilterHeader title="Sensitive Data Class" />
            <Select
              defaultValue={
                params &&
                params?.dataClasses?.map(dataClass => ({
                  label: dataClass as string,
                  value: dataClass as string,
                }))
              }
              isMulti={true}
              size="sm"
              options={dataClassesList.map(e => ({
                label: e,
                value: e,
              }))}
              placeholder="Filter by sensitive data class..."
              instanceId="endpoint-tbl-env-dataClass"
              onChange={e =>
                setParams(oldParams => ({
                  ...oldParams,
                  dataClasses: e.map(dataClass => dataClass.label as DataClass),
                  offset: 0,
                }))
              }
            />
          </Box>
          <Box w={{ base: "full", lg: "xs" }} zIndex="1000">
            <FilterHeader title="Detected Authentication" />
            <Select
              defaultValue={
                params &&
                { label: "All", value: null }
              }
              size="sm"
              options={[
                { label: "All", value: null },
                { label: "Authenticated", value: true },
                { label: "Unauthenticated", value: false }
              ]}
              placeholder="Filter by Detected Authentication"
              instanceId="endpoint-tbl-env-isAuthenticatedDetected"
              onChange={e =>
                setParams(oldParams => ({
                  ...oldParams,
                  isAuthenticatedDetected: e.value,
                  offset: 0,
                }))
              }
            />
          </Box>
        </Stack>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <GoSearch />
          </InputLeftElement>
          <Input
            onChange={e => debounceSearch(e.target.value)}
            w={{ base: "full", lg: "xs" }}
            type="text"
            placeholder="Search for endpoint..."
          />
        </InputGroup>
      </VStack>
    )
  },
)

export default EndpointFilters
