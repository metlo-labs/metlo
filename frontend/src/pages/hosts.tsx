import { GetServerSideProps } from "next"
import { useState } from "react"
import superjson from "superjson"
import { Box, Badge, Heading, HStack, VStack, Stack } from "@chakra-ui/react"
import { getHostsGraph, getHostsList } from "api/endpoints"
import { HostGraph, HostResponse } from "@common/types"
import { GetHostParams } from "@common/api/endpoint"
import { HOST_PAGE_LIMIT } from "~/constants"
import { PageWrapper } from "components/PageWrapper"
import { ContentContainer } from "components/utils/ContentContainer"
import HostList from "components/HostList"
import HostGraphComponent from "components/HostsGraph"
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
  const parsedHostsGraph = superjson.parse<HostGraph>(hostsGraph)

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
          <Stack
            direction={{ base: "column", sm: "row" }}
            w="full"
            justifyContent="space-between"
            alignItems={{ base: "flex-start", sm: "flex-end" }}
            mb="4"
            px={{ base: "0", md: "8" }}
            pt={{ base: "0", md: "8" }}
          >
            <Heading fontWeight="semibold" size="xl">
              Hosts
            </Heading>
            <HStack spacing="0" w={{ base: "full", sm: "unset" }}>
              <Badge
                as="button"
                onClick={() => setTab(false)}
                roundedLeft="md"
                py={1}
                px={6}
                borderWidth="2px 0px 2px 2px"
                colorScheme={graph ? "gray" : "white"}
                opacity={graph ? 0.7 : 1}
                rounded="none"
                w="full"
              >
                List
              </Badge>
              <Badge
                as="button"
                onClick={() => setTab(true)}
                roundedRight="md"
                py={1}
                px={6}
                borderWidth="2px 2px 2px 0px"
                colorScheme={graph ? "white" : "gray"}
                opacity={graph ? 1 : 0.7}
                rounded="none"
                w="full"
              >
                Graph
              </Badge>
            </HStack>
          </Stack>
          {graph ? (
            <Box flex="1" w="full">
              <HostGraphComponent {...parsedHostsGraph} />
            </Box>
          ) : (
            <Box
              w="full"
              px={{ base: "0", md: "8" }}
              pb={{ base: "0", md: "8" }}
            >
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
