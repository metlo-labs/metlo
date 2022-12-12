import { GetServerSideProps } from "next"
import { useState } from "react"
import superjson from "superjson"
import { Box, Badge, Heading, HStack, VStack } from "@chakra-ui/react"
import { getHostsGraph, getHostsList } from "api/endpoints"
import { GetHostParams, HostResponse } from "@common/types"
import { HOST_PAGE_LIMIT } from "~/constants"
import { PageWrapper } from "components/PageWrapper"
import { ContentContainer } from "components/utils/ContentContainer"
import HostList from "components/HostList"
import HostGraph, { HostGraphProps } from "components/HostsGraph"
import { useRouter } from "next/router"

const Hosts = ({ initHosts, hostsGraph, initTotalCount }) => {
  const router = useRouter()
  const { tab } = router.query
  const getDefaultTab = () => {
    switch (tab) {
      case "list":
        return false
      case "graph":
        return true
      default:
        return false
    }
  }

  const parsedInitHosts = superjson.parse<HostResponse[]>(initHosts)
  const parsedHostsGraph = superjson.parse<HostGraphProps>(hostsGraph)

  const [graph, setGraph] = useState<boolean>(getDefaultTab())
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

  const setTab = (graph: boolean) => {
    router.replace({
      query: { ...router.query, tab: graph ? "graph" : "list" },
    })
    setGraph(graph)
  }

  return (
    <PageWrapper title="Hosts">
      <ContentContainer
        maxContentW="100rem"
        px="0"
        py="0"
        height={graph ? "100vh" : undefined}
      >
        <VStack
          w="full"
          alignItems="flex-start"
          spacing="0"
          height={graph ? "full" : undefined}
        >
          <HStack
            w="full"
            justifyContent="space-between"
            alignItems="flex-end"
            mb="4"
            px="8"
            pt="8"
          >
            <Heading fontWeight="medium" size="lg">
              Hosts
            </Heading>
            <HStack spacing="0">
              <Badge
                as="button"
                onClick={() => setTab(false)}
                roundedLeft="md"
                p="1"
                borderWidth="2px 1px 2px 2px"
                colorScheme={graph ? "none" : "gray"}
                opacity={graph ? 0.5 : 1}
                rounded="none"
              >
                List
              </Badge>
              <Badge
                as="button"
                onClick={() => setTab(true)}
                roundedRight="md"
                p="1"
                borderWidth="2px 2px 2px 1px"
                colorScheme={graph ? "gray" : "none"}
                opacity={graph ? 1 : 0.5}
                rounded="none"
              >
                Graph
              </Badge>
            </HStack>
          </HStack>
          {graph ? (
            <Box flex="1" w="full">
              <HostGraph {...parsedHostsGraph} />
            </Box>
          ) : (
            <Box w="full" px="8" pb="8">
              <HostList
                hosts={hosts}
                fetching={fetching}
                totalCount={totalCount}
                params={params}
                setParams={setParams}
              />
            </Box>
          )}
        </VStack>
      </ContentContainer>
    </PageWrapper>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const hostsResp = await getHostsList({})
  const hostsGraph = await getHostsGraph({})
  const initHosts = hostsResp[0]
  const totalCount = hostsResp[1]
  return {
    props: {
      initHosts: superjson.stringify(initHosts),
      hostsGraph: superjson.stringify(hostsGraph),
      initTotalCount: totalCount,
    },
  }
}

export default Hosts
