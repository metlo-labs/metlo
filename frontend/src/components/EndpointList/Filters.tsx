import React from "react"
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
import { BsSearch } from "icons/bs/BsSearch"
import { GetEndpointParams } from "@common/api/endpoint"
import { RiskScore } from "@common/enums"
import debounce from "lodash/debounce"

interface EndpointFilterProps {
  hostList: string[]
  riskList: string[]
  dataClassesList: string[]
  params: GetEndpointParams
  setParams: (newParams: GetEndpointParams) => void
}

enum AuthenticationFilter {
  AUTHENTICATED = "true",
  UNAUTHENTICATED = "false",
  ALL = "",
}

const getAuthenticationLabel = (value: AuthenticationFilter) => {
  switch (value) {
    case AuthenticationFilter.ALL:
      return "All"
    case AuthenticationFilter.AUTHENTICATED:
      return "Authenticated"
    case AuthenticationFilter.UNAUTHENTICATED:
      return "Unauthenticated"
    default:
      return "All"
  }
}

const FilterHeader: React.FC<{ title: string }> = React.memo(({ title }) => (
  <Text fontWeight="semibold" mb="2" fontSize="sm">
    {title}
  </Text>
))

const EndpointFilters: React.FC<EndpointFilterProps> = React.memo(
  ({ hostList, riskList, dataClassesList, params, setParams }) => {
    const setSearchQuery = (val: string) => {
      setParams({
        searchQuery: val,
        offset: 0,
      })
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
                setParams({
                  hosts: e.map(host => host.label),
                  offset: 0,
                })
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
                setParams({
                  riskScores: e.map(riskScore => riskScore.label as RiskScore),
                  offset: 0,
                })
              }
            />
          </Box>
          <Box w={{ base: "full", lg: "xs" }} zIndex="1001">
            <FilterHeader title="Sensitive Data Class" />
            <Select
              value={
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
                setParams({
                  dataClasses: e.map(dataClass => dataClass.label),
                  offset: 0,
                })
              }
            />
          </Box>
          <Box w={{ base: "full", lg: "xs" }} zIndex="1000">
            <FilterHeader title="Authentication" />
            <Select
              value={{
                label: getAuthenticationLabel(
                  params.isAuthenticated as AuthenticationFilter,
                ),
                value: params.isAuthenticated,
              }}
              size="sm"
              options={Object.keys(AuthenticationFilter).map(e => ({
                label: getAuthenticationLabel(AuthenticationFilter[e]),
                value: AuthenticationFilter[e],
              }))}
              placeholder="Filter by Authentication"
              instanceId="endpoint-tbl-env-isAuthenticated"
              onChange={e =>
                e.value !== params.isAuthenticated &&
                setParams({
                  isAuthenticated: e.value,
                  offset: 0,
                })
              }
            />
          </Box>
        </Stack>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <BsSearch />
          </InputLeftElement>
          <Input
            defaultValue={params.searchQuery}
            spellCheck={false}
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
