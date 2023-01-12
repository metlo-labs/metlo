import React, { useState } from "react"
import { Box, VStack } from "@chakra-ui/react"
import { HostResponse } from "@common/types"
import { GetHostParams } from "@common/api/endpoint"
import List from "./List"
import { HOST_PAGE_LIMIT } from "~/constants"
import HostFilters from "./Filters"

interface HostListProps {
  fetching: boolean
  hosts: HostResponse[]
  totalCount: number
  setParams: (t: (e: GetHostParams) => GetHostParams) => void
  params: GetHostParams
}

const HostList: React.FC<HostListProps> = React.memo(
  ({ hosts, fetching, totalCount, params, setParams }) => {
    const setCurrentPage = (page: number) => {
      setParams(oldParams => ({
        ...oldParams,
        offset: (page - 1) * HOST_PAGE_LIMIT,
      }))
    }
    const [selectedHosts, setSelectedHosts] = useState<string[]>([])

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
          <HostFilters
            params={params}
            setParams={setParams}
            selectedHosts={selectedHosts}
            setSelectedHosts={setSelectedHosts}
          />
        </Box>
        <Box w="full">
          <List
            hosts={hosts}
            totalCount={totalCount}
            currentPage={params.offset / HOST_PAGE_LIMIT + 1}
            setCurrentPage={setCurrentPage}
            fetching={fetching}
            setSelectedHosts={setSelectedHosts}
          />
        </Box>
      </VStack>
    )
  },
)

export default HostList
