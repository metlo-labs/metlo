import { Heading, VStack } from "@chakra-ui/react"
import superjson from "superjson"
import { useState } from "react"
import { GetServerSideProps } from "next"
import { ApiEndpoint, GetEndpointParams } from "@common/types"
import { DataClass, RiskScore } from "@common/enums"
import EndpointList from "components/EndpointList"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { ContentContainer } from "components/utils/ContentContainer"
import { getEndpoints, getHosts } from "api/endpoints"
import { ENDPOINT_PAGE_LIMIT } from "~/constants"

const Endpoints = ({ initParams, initEndpoints, initTotalCount, hosts }) => {
  const parsedInitParams = superjson.parse<GetEndpointParams>(initParams)
  const parsedInitEndpoints = superjson.parse<ApiEndpoint[]>(initEndpoints)
  const parsedHosts = superjson.parse<string[]>(hosts ?? [])

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
    <SidebarLayoutShell
      title="Endpoints"
      currentTab={SideNavLinkDestination.Endpoints}
    >
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
          />
        </VStack>
      </ContentContainer>
    </SidebarLayoutShell>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const initParams: GetEndpointParams = {
    riskScores: ((context.query.riskScores as string) || "")
      .split(",")
      .filter(e => Object.values(RiskScore).includes(e as RiskScore))
      .map(e => e as RiskScore),
    hosts: ((context.query.hosts as string) || null)?.split(",") ?? [],
    dataClasses: ((context.query.dataClasses as string) || "")
      .split(",")
      .filter(e => Object.values(DataClass).includes(e as DataClass))
      .map(e => e as DataClass),
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
    },
  }
}

export default Endpoints
