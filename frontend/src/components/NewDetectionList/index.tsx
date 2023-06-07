import React from "react"
import { Box, VStack } from "@chakra-ui/react"
import { ApiEndpoint, DataClass, DataField } from "@common/types"
import {
  GetNewDetectionsParams,
  NewDetectionsAggRes,
} from "@common/api/endpoint"
import { NewDetectionFilters } from "./Filters"
import { NewDetectionTable } from "./List"
import { ENDPOINT_PAGE_LIMIT } from "~/constants"
import { RiskScore } from "@common/enums"
import { NewDetectionAggChart } from "./Chart"

interface NewDetectionListProps {
  fetching: boolean
  newDetections: (ApiEndpoint | DataField)[]
  detectionAgg: NewDetectionsAggRes[]
  totalCount: number
  setParams: (newParams: GetNewDetectionsParams) => void
  params: GetNewDetectionsParams
  hosts: string[]
  dataClasses: DataClass[]
}

const NewDetectionList: React.FC<NewDetectionListProps> = React.memo(
  ({
    fetching,
    newDetections,
    totalCount,
    params,
    setParams,
    hosts,
    dataClasses,
    detectionAgg,
  }) => {
    const setCurrentPage = (page: number) => {
      setParams({
        detectionOffset: (page - 1) * ENDPOINT_PAGE_LIMIT,
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
        bg="white"
      >
        <Box
          roundedTop="xl"
          py="2"
          px="4"
          borderBottom="1px"
          borderColor="inherit"
          w="full"
        >
          <NewDetectionFilters
            hostList={hosts}
            riskList={Object.values(RiskScore)}
            params={params}
            setParams={setParams}
          />
        </Box>
        <Box w="full" py="2" px="4" borderBottom="1px" borderColor="inherit">
          <NewDetectionAggChart data={detectionAgg} />
        </Box>
        <Box w="full">
          <NewDetectionTable
            newDetections={newDetections}
            totalCount={totalCount}
            currentPage={params.detectionOffset / ENDPOINT_PAGE_LIMIT + 1}
            setCurrentPage={setCurrentPage}
            fetching={fetching}
            dataClasses={dataClasses}
            detectionType={params.detectionType}
          />
        </Box>
      </VStack>
    )
  },
)

export default NewDetectionList
