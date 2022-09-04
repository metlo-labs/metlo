import React from "react"
import { Box, VStack } from "@chakra-ui/react"
import { ApiEndpoint, GetEndpointParams } from "@common/types"
import EndpointFilters from "./Filters"
import List from "./List"
import { ENDPOINT_PAGE_LIMIT } from "~/constants"
import { DataClass, RiskScore } from "@common/enums"

interface EndpointListProps {
  fetching: boolean
  endpoints: ApiEndpoint[]
  totalCount: number
  setParams: (t: (e: GetEndpointParams) => GetEndpointParams) => void
  params: GetEndpointParams
  hosts: string[]
}

const EndpointList: React.FC<EndpointListProps> = React.memo(
  ({ endpoints, fetching, totalCount, params, setParams, hosts }) => {
    const setCurrentPage = (page: number) => {
      setParams(oldParams => ({
        ...oldParams,
        offset: (page - 1) * ENDPOINT_PAGE_LIMIT,
      }))
    }
    return (
      <VStack
        w="full"
        alignItems="flex-start"
        borderWidth="1px"
        rounded="md"
        spacing="0"
        overflow="visible"
      >
        <Box p="4" borderBottom="1px" borderColor="inherit" w="full">
          <EndpointFilters
            hostList={hosts}
            riskList={Object.values(RiskScore)}
            dataClassesList={Object.values(DataClass)}
            params={params}
            setParams={setParams}
          />
        </Box>
        <Box w="full">
          <List
            endpoints={endpoints}
            totalCount={totalCount}
            currentPage={params.offset / ENDPOINT_PAGE_LIMIT + 1}
            setCurrentPage={setCurrentPage}
            fetching={fetching}
            setOrdering={(e: "ASC" | "DESC") => {}}
            setOrderBy={(e: string | undefined) => {}}
          />
        </Box>
      </VStack>
    )
  },
)

export default EndpointList
