import React, { useState } from "react"
import { Box, Heading, VStack } from "@chakra-ui/react"
import { ContentContainer } from "components/utils/ContentContainer"
import AggPIIChart from "components/SensitiveData/AggPIIChart"
import { GetSensitiveDataAggParams, SensitiveDataSummary } from "@common/types"
import SensitiveDataFilters from "./Filters"
import List from "./List"
import { getSensitiveDataSummary } from "api/sensitiveData"

interface SensitiveDataPageProps {
  initSummary: SensitiveDataSummary
  hosts: string[]
}

const SensitiveDataPage: React.FC<SensitiveDataPageProps> = React.memo(
  ({ initSummary, hosts }) => {
    const [fetching, setFetching] = useState<boolean>(false)
    const [summary, setSummary] = useState<SensitiveDataSummary>(initSummary)
    const [params, setParamsInner] = useState<GetSensitiveDataAggParams>({
      hosts: [],
      riskScores: [],
      locations: [],
    })

    const setParams = (
      t: (params: GetSensitiveDataAggParams) => GetSensitiveDataAggParams,
    ) => {
      setFetching(true)
      const newParams = t(params)
      setParamsInner(newParams)
      getSensitiveDataSummary(newParams)
        .then(e => setSummary(e))
        .catch(e => console.error(e))
        .finally(() => setFetching(false))
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
