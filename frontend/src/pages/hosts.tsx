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
import { HostsTab } from "enums"

const Hosts = ({ hosts, hostsGraph, totalCount, params }) => {
  const router = useRouter()
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
  const parsedHosts = superjson.parse<HostResponse[]>(hosts)
  const parsedHostsGraph = superjson.parse<HostGraph>(hostsGraph)
  const parsedParams = superjson.parse<GetHostParams>(params)

  const [fetching, setFetching] = useState<boolean>(false)

  const setParams = (newParams: GetHostParams) => {
    setFetching(true)
    router.push({
      query: {
        ...parsedParams,
        ...newParams,
      },
    })
    setFetching(false)
  }

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
              <HostGraphComponent {...parsedHostsGraph} />
            </Box>
          ) : (
            <Box
              w="full"
              px={{ base: "0", md: "8" }}
              pb={{ base: "0", md: "8" }}
            >
              <HostList
                hosts={parsedHosts}
                fetching={fetching}
                totalCount={totalCount}
                params={parsedParams}
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
  }
  const hostsResp = await getHostsList(params)
  const hostsGraph = await getHostsGraph({})
  const hosts = hostsResp[0]
  const totalCount = hostsResp[1]
  return {
    props: {
      hosts: superjson.stringify(hosts),
      hostsGraph: superjson.stringify(hostsGraph),
      totalCount: totalCount,
      params: superjson.stringify(params),
    },
  }
}

export default Hosts
