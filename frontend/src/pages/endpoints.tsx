import { Heading, VStack } from "@chakra-ui/react"
import { GetServerSideProps } from "next"
import superjson from "superjson"
import Error from "next/error"
import { useEffect, useState } from "react"
import { ApiEndpoint, GetEndpointParams } from "@common/types"
import EndpointList from "components/EndpointList"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { ContentContainer } from "components/utils/ContentContainer"
import { getEndpoints, getHosts } from "api/endpoints"
import { ENDPOINT_PAGE_LIMIT } from "~/constants"

const Endpoints = ({ initHosts }) => {
  const hosts = superjson.parse<string[]>(initHosts || [])
  const [fetching, setFetching] = useState<boolean>(true)
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([])
  const [totalCount, setTotalCount] = useState<number>()
  const [params, setParams] = useState<GetEndpointParams>({
    hosts: [],
    riskScores: [],
    offset: 0,
    limit: ENDPOINT_PAGE_LIMIT,
  })
  useEffect(() => {
    const fetchEndpoints = async () => {
      const res = await getEndpoints(params)
      setEndpoints(res[0])
      setTotalCount(res[1])
      setFetching(false)
    }
    fetchEndpoints()
  }, [params])
  return (
    <SidebarLayoutShell
      title="Endpoints"
      currentTab={SideNavLinkDestination.Endpoints}
    >
      <ContentContainer maxContentW="100rem" px="8" py="8">
        <VStack w="full" alignItems="flex-start">
          <Heading fontWeight="medium" size="lg" mb="4">
            Endpoints
          </Heading>
          <EndpointList
            hosts={hosts}
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
  const hosts = await getHosts()
  return {
    props: {
      initHosts: superjson.stringify(hosts),
    },
  }
}

export default Endpoints
