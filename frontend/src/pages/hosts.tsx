import { GetServerSideProps } from "next"
import { useEffect, useState } from "react"
import superjson from "superjson"
import {
  Box,
  Badge,
  Heading,
  HStack,
  VStack,
  Stack,
  useToast,
} from "@chakra-ui/react"
import { getHostsGraph, getHostsList } from "api/endpoints"
import { HostGraph, HostResponse } from "@common/types"
import { GetHostParams } from "@common/api/endpoint"
import { HOST_PAGE_LIMIT } from "~/constants"
import { PageWrapper } from "components/PageWrapper"
import { ContentContainer } from "components/utils/ContentContainer"
import HostList from "components/HostList"
import HostGraphComponent from "components/HostsGraph"
import { useRouter } from "next/router"
import { HostsTab } from "enums"
import { HostSortOptions, SortOrder } from "@common/enums"
import { makeToast } from "utils"
import { formatMetloAPIErr, MetloAPIErr } from "api/utils"

const Hosts = ({ initHosts, initHostsGraph, initTotalCount, initParams }) => {
  const router = useRouter()
  const toast = useToast()
  const { tab } = router.query

  const getTab = () => {
    switch (tab) {
      case HostsTab.LIST:
        return 0
      case HostsTab.GRAPH:
        return 1
      default:
        return 0
    }
  }

  const isGraph = getTab() === 1
  const parsedInitHosts = superjson.parse<HostResponse[]>(initHosts)
  const parsedInitHostsGraph = superjson.parse<HostGraph>(initHostsGraph)
  const parsedInitParams = superjson.parse<GetHostParams>(initParams)

  const [hosts, setHosts] = useState<HostResponse[]>(parsedInitHosts)
  const [hostsGraph, setHostsGraph] = useState<HostGraph>(parsedInitHostsGraph)
  const [params, setParamsInner] = useState<GetHostParams>(parsedInitParams)
  const [totalCount, setTotalCount] = useState<number>(initTotalCount)

  const [fetching, setFetching] = useState<boolean>(false)

  const fetchHostsResp = async (fetchParams: GetHostParams) => {
    setFetching(true)
    try {
      const resp = await getHostsList(fetchParams)
      setHosts(resp[0])
      setTotalCount(resp[1])
    } catch (err) {
      toast(
        makeToast({
          title: "Fetching hosts failed...",
          status: "error",
          description: formatMetloAPIErr(err.response.data as MetloAPIErr),
        }),
      )
    } finally {
      setFetching(false)
    }
  }

  const setParams = (t: (e: GetHostParams) => GetHostParams) => {
    setParamsInner(t)
  }

  useEffect(() => {
    fetchHostsResp(params)
    router.push(
      {
        query: {
          ...params,
        },
      },
      undefined,
      { shallow: true },
    )
    window.onpopstate = () => {
      router.reload()
    }
  }, [params])

  const setTab = (newTab: HostsTab) => {
    router.push(newTab ? { query: { tab: newTab } } : {}, undefined, {
      shallow: true,
    })
  }

  return (
    <PageWrapper title="Hosts">
      <ContentContainer
        maxContentW="100rem"
        px="0"
        py="0"
        height={isGraph ? "100vh" : undefined}
      >
        <VStack
          w="full"
          alignItems="flex-start"
          spacing="0"
          height={isGraph ? "full" : undefined}
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
                onClick={() => setTab(undefined)}
                roundedLeft="md"
                py={1}
                px={6}
                borderWidth="2px 0px 2px 2px"
                colorScheme={isGraph ? "gray" : "white"}
                opacity={isGraph ? 0.7 : 1}
                rounded="none"
                w="full"
              >
                List
              </Badge>
              <Badge
                as="button"
                onClick={() => setTab(HostsTab.GRAPH)}
                roundedRight="md"
                py={1}
                px={6}
                borderWidth="2px 2px 2px 0px"
                colorScheme={isGraph ? "white" : "gray"}
                opacity={isGraph ? 1 : 0.7}
                rounded="none"
                w="full"
              >
                Graph
              </Badge>
            </HStack>
          </Stack>
          {isGraph ? (
            <Box flex="1" w="full">
              <HostGraphComponent {...hostsGraph} />
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
  const params: GetHostParams = {
    searchQuery: (context.query.searchQuery as string) ?? "",
    offset: parseInt((context.query.offset as string) ?? "0"),
    limit: HOST_PAGE_LIMIT,
    sortBy:
      (context.query.sortBy as HostSortOptions) ??
      HostSortOptions.NUM_ENDPOINTS,
    sortOrder: (context.query.sortOrder as SortOrder) ?? SortOrder.DESC,
  }
  const hostsResp = await getHostsList(params)
  const hostsGraph = await getHostsGraph({})
  const hosts = hostsResp[0]
  const totalCount = hostsResp[1]
  return {
    props: {
      initHosts: superjson.stringify(hosts),
      initHostsGraph: superjson.stringify(hostsGraph),
      initTotalCount: totalCount,
      initParams: superjson.stringify(params),
    },
  }
}

export default Hosts
