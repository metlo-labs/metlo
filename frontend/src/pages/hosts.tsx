import { GetServerSideProps } from "next"
import { useState } from "react"
import superjson from "superjson"
import { Heading, VStack } from "@chakra-ui/react"
import { getHostsList } from "api/endpoints"
import { GetHostParams, HostResponse } from "@common/types"
import { HOST_PAGE_LIMIT } from "~/constants"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { ContentContainer } from "components/utils/ContentContainer"
import HostList from "components/HostList"

const Hosts = ({ initHosts, initTotalCount }) => {
  const parsedInitHosts = superjson.parse<HostResponse[]>(initHosts)

  const [fetching, setFetching] = useState<boolean>(false)
  const [hosts, setHosts] = useState<HostResponse[]>(parsedInitHosts)
  const [totalCount, setTotalCount] = useState<number>(initTotalCount)
  const [params, setParamsInner] = useState<GetHostParams>({
    offset: 0,
    limit: HOST_PAGE_LIMIT,
  })

  const fetchHosts = (fetchParams: GetHostParams) => {
    setFetching(true)
    const fetch = async () => {
      const res = await getHostsList(fetchParams)
      setHosts(res[0])
      setTotalCount(res[1])
      setFetching(false)
    }
    fetch()
  }

  const setParams = (t: (e: GetHostParams) => GetHostParams) => {
    let newParams = t(params)
    setParamsInner(newParams)
    fetchHosts(newParams)
  }

  return (
    <SidebarLayoutShell title="Hosts" currentTab={SideNavLinkDestination.Hosts}>
      <ContentContainer maxContentW="100rem" px="8" py="8">
        <VStack w="full" alignItems="flex-start" spacing="0">
          <Heading fontWeight="medium" size="lg" mb="4">
            Hosts
          </Heading>
          <HostList
            hosts={hosts}
            fetching={fetching}
            totalCount={totalCount}
            params={params}
            setParams={setParams}
          />
        </VStack>
      </ContentContainer>
    </SidebarLayoutShell>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const hostsResp = await getHostsList({})
  const initHosts = hostsResp[0]
  const totalCount = hostsResp[1]
  return {
    props: {
      initHosts: superjson.stringify(initHosts),
      initTotalCount: totalCount,
    },
  }
}

export default Hosts
