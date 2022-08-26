import { Heading, VStack } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { ApiEndpoint, GetEndpointParams } from "@common/types"
import EndpointList from "components/EndpointList"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { ContentContainer } from "components/utils/ContentContainer"
import { getEndpoints, getHosts } from "api/endpoints"
import { ENDPOINT_PAGE_LIMIT } from "~/constants"

const Endpoints = () => {
  const [fetching, setFetching] = useState<boolean>(true)
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([])
  const [totalCount, setTotalCount] = useState<number>()
  const [hosts, setHosts] = useState<string[]>([])
  const [params, setParams] = useState<GetEndpointParams>({
    hosts: [],
    riskScores: [],
    offset: 0,
    limit: ENDPOINT_PAGE_LIMIT,
  })
  useEffect(() => {
    const fetchHosts = async () => {
      const res = await getHosts()
      setHosts(res)
    }
    fetchHosts()
  }, [])
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
      <ContentContainer>
        <VStack w="full" alignItems="flex-start">
          <Heading fontWeight="medium" size="xl" mb="8">
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

export default Endpoints
