import React, { useState } from "react"
import { useRouter } from "next/router"
import { Box, Heading, VStack } from "@chakra-ui/react"
import { ContentContainer } from "components/utils/ContentContainer"
import AggPIIChart from "components/SensitiveData/AggPIIChart"
import { SensitiveDataSummary } from "@common/types"
import { GetSensitiveDataAggParams } from "@common/api/summary"
import SensitiveDataFilters from "./Filters"
import List from "./List"

interface SensitiveDataPageProps {
  summary: SensitiveDataSummary
  hosts: string[]
  params: GetSensitiveDataAggParams
}

const SensitiveDataPage: React.FC<SensitiveDataPageProps> = React.memo(
  ({ summary, hosts, params }) => {
    const [fetching, setFetching] = useState<boolean>(false)
    const router = useRouter()

    const setParams = (newParams: GetSensitiveDataAggParams) => {
      setFetching(true)
      newParams = { ...params, ...newParams }
      router.push({
        query: {
          hosts: newParams.hosts.join(","),
          riskScores: newParams.riskScores.join(","),
          locations: newParams.locations.join(","),
        },
      })
    }

    return (
      <ContentContainer maxContentW="100rem" px="8" py="8">
        <VStack w="full" alignItems="flex-start">
          <Heading fontWeight="medium" size="lg" mb="4">
            Sensitive Data
          </Heading>
        </VStack>
        <VStack
          w="full"
          alignItems="flex-start"
          borderWidth="1px"
          rounded="md"
          spacing="0"
          overflow="hidden"
        >
          <Box p="4" borderBottom="1px" borderColor="inherit" w="full">
            <SensitiveDataFilters
              hostList={hosts}
              locations={params.locations}
              hosts={params.hosts}
              riskScores={params.riskScores}
              setParams={setParams}
            />
          </Box>
          <AggPIIChart
            piiDataTypeCount={summary.piiDataTypeCount}
            totalPIIFields={summary.totalPIIFields}
            totalEndpoints={summary.totalEndpoints}
          />
          <Box w="full" borderTop="1px" borderColor="inherit">
            <List items={summary.piiItems} params={params} />
          </Box>
        </VStack>
      </ContentContainer>
    )
  },
)

export default SensitiveDataPage
