import React, { useState } from "react"
import { Stack, Box, Text, VStack, Input, InputGroup, InputLeftElement } from "@chakra-ui/react"
import { Select } from "chakra-react-select"
import { GoSearch } from "@react-icons/all-files/go/GoSearch"
import { GetEndpointParams } from "@common/types"
import { DataClass, RiskScore } from "@common/enums"
import { useDebounce } from "hooks/use-debounce"
import { useEffect } from "react"

interface EndpointFilterProps {
  host?: string
  riskScore?: string
  hostList: string[]
  riskList: string[]
  dataClassesList: string[]
  setParams: (t: (e: GetEndpointParams) => GetEndpointParams) => void
}

const FilterHeader: React.FC<{ title: string }> = React.memo(({ title }) => (
  <Text fontWeight="semibold" mb="2" fontSize="sm">
    {title}
  </Text>
))

const EndpointFilters: React.FC<EndpointFilterProps> = React.memo(
  ({ host, hostList, riskScore, riskList, dataClassesList, setParams }) => {
    const [searchQuery, setSearchQuery] = useState("")
    const debouncedSearchQuery = useDebounce(searchQuery, 500)

    useEffect(() => {
      setParams(oldParams => ({
        ...oldParams,
        searchQuery: debouncedSearchQuery,
        offset: 0,
      }))
    }, [debouncedSearchQuery])

    return (
      <VStack spacing="6">
        <Stack direction={{ base: "column", lg: "row" }} spacing="4" w="full">
          <Box w={{ base: "full", lg: "xs"}} zIndex="1003">
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
          <Box w={{ base: "full", lg: "xs"}} zIndex="1002">
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
          <Box w={{ base: "full", lg: "xs"}} zIndex="1001">
            <FilterHeader title="Sensitive Data Class" />
            <Select
              value={
                riskScore && {
                  label: riskScore,
                  value: riskScore,
                }
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
        </Stack>
        <InputGroup>
          <InputLeftElement pointerEvents="none" children={<GoSearch />} />
          <Input onChange={(e) => setSearchQuery(e.target.value)} w={{ base: "full", lg: "xs"}} type="text" placeholder="Search for endpoint..." />
        </InputGroup>
      </VStack>
    )
  },
)

export default EndpointFilters
