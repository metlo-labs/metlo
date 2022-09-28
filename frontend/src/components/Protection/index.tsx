import React, { useState } from "react"
import { Box, Heading, useToast, VStack } from "@chakra-ui/react"
import { AttackResponse, GetAttackParams } from "@common/types"
import { ATTACK_PAGE_LIMIT } from "~/constants"
import { getAttacks } from "api/attacks"
import { ContentContainer } from "components/utils/ContentContainer"
import { AttackFilters } from "./Filters"
import { AggAttackChart } from "./AggAttackChart"
import { List } from "./List"

interface ProtectionPageProps {
  initAttackResponse: AttackResponse
  hosts: string[]
}

export const ProtectionPage: React.FC<ProtectionPageProps> = React.memo(
  ({ initAttackResponse, hosts }) => {
    const [fetching, setFetching] = useState<boolean>(false)
    const [response, setResponse] = useState<AttackResponse>(initAttackResponse)
    const [params, setParamsInner] = useState<GetAttackParams>({
      hosts: [],
      riskScores: [],
      offset: 0,
      limit: ATTACK_PAGE_LIMIT,
    })
    const toast = useToast()

    const fetchAttacks = (fetchParams: GetAttackParams) => {
      setFetching(true)
      getAttacks(fetchParams)
        .then(res => setResponse(res))
        .catch(err =>
          toast({
            title: "Fetching Protection Data failed...",
            status: "error",
            duration: 5000,
            isClosable: true,
          }),
        )
        .finally(() => setFetching(false))
    }

    const setParams = (t: (params: GetAttackParams) => GetAttackParams) => {
      const newParams = t(params)
      setParamsInner(newParams)
      fetchAttacks(newParams)
    }

    const setCurrentPage = (page: number) => {
      setParams(oldParams => ({
        ...oldParams,
        offset: (page - 1) * ATTACK_PAGE_LIMIT,
      }))
    }

    return (
      <ContentContainer maxContentW="100rem" px="8" py="8">
        <VStack w="full" alignItems="flex-start">
          <Heading fontWeight="medium" size="lg" mb="4">
            Protection
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
            <AttackFilters
              hostList={hosts}
              hosts={params.hosts}
              riskScores={params.riskScores}
              setParams={setParams}
            />
          </Box>
          <AggAttackChart
            attackTypeCount={response.attackTypeCount}
            totalAttacks={response.totalAttacks}
            totalEndpoints={response.totalEndpoints}
          />
          <Box w="full" borderTop="1px" borderColor="inherit">
            <List
              items={response.attacks}
              totalCount={response.totalAttacks}
              setCurrentPage={setCurrentPage}
              currentPage={params.offset / ATTACK_PAGE_LIMIT + 1}
              fetching={fetching}
            />
          </Box>
        </VStack>
      </ContentContainer>
    )
  },
)
