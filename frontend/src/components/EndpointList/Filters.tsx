import React, { useState, useEffect, useMemo } from "react"
import {
  Stack,
  Box,
  Text,
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
  Grid,
  GridItem,
} from "@chakra-ui/react"
import { Select } from "chakra-react-select"
import { BsSearch } from "icons/bs/BsSearch"
import { GetEndpointParams } from "@common/api/endpoint"
import { RestMethod, RiskScore } from "@common/enums"
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
    const [tmpQuery, setTmpQuery] = useState<string>(params.searchQuery)
    const debounceSearch = useMemo(() => debounce(setSearchQuery, 500), [])

    useEffect(() => {
      setTmpQuery(params.searchQuery)

      return () => {
        debounceSearch.cancel()
      }
    }, [params.searchQuery])

    return (
      <VStack spacing="6">
        <Grid
          gap="4"
          w="full"
          templateColumns={{
            base: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            xl: "repeat(4, 1fr)",
            "2xl": "repeat(5, 1fr)",
          }}
          zIndex="overlay"
        >
          <GridItem>
            <Box zIndex="1004">
              <FilterHeader title="Host" />
              <Select
                className="chakra-react-select"
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
          </GridItem>
          <GridItem>
            <Box zIndex="1003">
              <FilterHeader title="Method" />
              <Select
                className="chakra-react-select"
                value={
                  params &&
                  params?.methods?.map(method => ({
                    label: method as string,
                    value: method as string,
                  }))
                }
                isMulti={true}
                size="sm"
                options={Object.values(RestMethod).map(e => ({
                  label: e,
                  value: e,
                }))}
                placeholder="Filter by method..."
                instanceId="endpoint-tbl-env-method"
                onChange={e =>
                  setParams({
                    methods: e.map(method => method.label as RestMethod),
                    offset: 0,
                  })
                }
              />
            </Box>
          </GridItem>
          <GridItem>
            <Box zIndex="1002">
              <FilterHeader title="Risk Score" />
              <Select
                className="chakra-react-select"
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
                    riskScores: e.map(
                      riskScore => riskScore.label as RiskScore,
                    ),
                    offset: 0,
                  })
                }
              />
            </Box>
          </GridItem>
          <GridItem colSpan={{ base: 1, md: 2, xl: 1 }}>
            <Box zIndex="1001">
              <FilterHeader title="Sensitive Data Class" />
              <Select
                className="chakra-react-select"
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
          </GridItem>
          <GridItem>
            <Box zIndex="1000">
              <FilterHeader title="Authentication" />
              <Select
                className="chakra-react-select"
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
          </GridItem>
        </Grid>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <BsSearch />
          </InputLeftElement>
          <Input
            value={tmpQuery}
            spellCheck={false}
            onChange={e => {
              debounceSearch(e.target.value)
              setTmpQuery(e.target.value)
            }}
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
