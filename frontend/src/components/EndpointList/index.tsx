import React, { MutableRefObject } from "react"
import { Box, VStack } from "@chakra-ui/react"
import { ApiEndpoint, DataClass } from "@common/types"
import { GetEndpointParams } from "@common/api/endpoint"
import EndpointFilters from "./Filters"
import List from "./List"
import { ENDPOINT_PAGE_LIMIT } from "~/constants"
import { RiskScore } from "@common/enums"

interface EndpointListProps {
  fetching: boolean
  endpoints: ApiEndpoint[]
  totalCount: number
  setParams: (newParams: GetEndpointParams) => void
  params: GetEndpointParams
  hosts: string[]
  dataClasses: DataClass[]
  selectedUuids: MutableRefObject<string[]>
}

const EndpointList: React.FC<EndpointListProps> = React.memo(
  ({
    endpoints,
    fetching,
    totalCount,
    params,
    setParams,
    hosts,
    dataClasses,
    selectedUuids,
  }) => {
    const setCurrentPage = (page: number) => {
      setParams({
        offset: (page - 1) * ENDPOINT_PAGE_LIMIT,
      })
    }
    return (
      <VStack
        w="full"
        alignItems="flex-start"
        borderWidth="1px"
        rounded="lg"
        spacing="0"
        overflow="visible"
      >
        <Box
          roundedTop="xl"
          bg="white"
          p="4"
          borderBottom="1px"
          borderColor="inherit"
          w="full"
        >
          <EndpointFilters
            hostList={hosts}
            riskList={Object.values(RiskScore)}
            dataClassesList={dataClasses.map(({ className }) => className)}
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
            dataClasses={dataClasses}
            selectedUuids={selectedUuids}
          />
        </Box>
      </VStack>
    )
  },
)

export default EndpointList
