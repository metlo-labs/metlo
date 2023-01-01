import { Heading, VStack } from "@chakra-ui/react"
import superjson from "superjson"
import { useState } from "react"
import { GetServerSideProps } from "next"
import { ApiEndpoint, DataClass } from "@common/types"
import { GetEndpointParams } from "@common/api/endpoint"
import { RiskScore } from "@common/enums"
import EndpointList from "components/EndpointList"
import { PageWrapper } from "components/PageWrapper"
import { ContentContainer } from "components/utils/ContentContainer"
import { getEndpoints, getHosts } from "api/endpoints"
import { ENDPOINT_PAGE_LIMIT } from "~/constants"
import { getDataClasses } from "api/dataClasses"

interface EndpointsProps {
  initParams: string
  initEndpoints: string
  initTotalCount: number
  hosts: string
  dataClasses: string
}

const Endpoints: React.FC<EndpointsProps> = ({
  initParams,
  initEndpoints,
  initTotalCount,
  hosts,
  dataClasses,
}) => {
  const parsedInitParams = superjson.parse<GetEndpointParams>(initParams)
  const parsedInitEndpoints = superjson.parse<ApiEndpoint[]>(initEndpoints)
  const parsedHosts = superjson.parse<string[]>(hosts) ?? []
  const parsedDataClasses = superjson.parse<DataClass[]>(dataClasses) ?? []

  const [fetching, setFetching] = useState<boolean>(false)
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(parsedInitEndpoints)
  const [totalCount, setTotalCount] = useState<number>(initTotalCount)
  const [params, setParamsInner] = useState<GetEndpointParams>(parsedInitParams)

  const fetchEndpoints = (fetchParams: GetEndpointParams) => {
    setFetching(true)
    const fetch = async () => {
      const res = await getEndpoints(fetchParams)
      setEndpoints(res[0])
      setTotalCount(res[1])
      setFetching(false)
    }
    fetch()
  }

  const setParams = (t: (e: GetEndpointParams) => GetEndpointParams) => {
    let newParams = t(params)
    setParamsInner(newParams)
    fetchEndpoints(newParams)
  }

  return (
    <PageWrapper title="Endpoints">
      <ContentContainer maxContentW="100rem" px="8" py="8">
        <VStack w="full" alignItems="flex-start" spacing="0">
          <Heading fontWeight="medium" size="lg" mb="4">
            Endpoints
          </Heading>
          <EndpointList
            hosts={parsedHosts}
            endpoints={endpoints}
            fetching={fetching}
            params={params}
            totalCount={totalCount}
            setParams={setParams}
            dataClasses={parsedDataClasses}
          />
        </VStack>
      </ContentContainer>
    </PageWrapper>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const dataClasses: DataClass[] = await getDataClasses({})
  const initParams: GetEndpointParams = {
    riskScores: ((context.query.riskScores as string) || "")
      .split(",")
      .filter(e => Object.values(RiskScore).includes(e as RiskScore))
      .map(e => e as RiskScore),
    hosts: ((context.query.hosts as string) || null)?.split(",") ?? [],
    dataClasses: ((context.query.dataClasses as string) || "")
      .split(",")
      .filter(e => dataClasses.find(({ className }) => className == e)),
    offset: 0,
    searchQuery: "",
    isAuthenticated: null,
    limit: ENDPOINT_PAGE_LIMIT,
  }
  const hostsPromise = getHosts()
  const endpointsPromise = getEndpoints(initParams)
  const [hosts, endpoints] = await Promise.all([hostsPromise, endpointsPromise])
  const initEndpoints = endpoints[0]
  const totalCount = endpoints[1]
  return {
    props: {
      initParams: superjson.stringify(initParams),
      initEndpoints: superjson.stringify(initEndpoints),
      initTotalCount: totalCount,
      hosts: superjson.stringify(hosts),
      dataClasses: superjson.stringify(dataClasses),
    },
  }
}

export default Endpoints
