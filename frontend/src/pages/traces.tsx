import { Button, Code, Heading, HStack, Input, VStack } from "@chakra-ui/react"
import { useState } from "react"
import { ApiTrace } from "@common/types"
import { PageWrapper } from "components/PageWrapper"
import { ContentContainer } from "components/utils/ContentContainer"
import { GetTracesParams } from "@common/api/trace"
import { getTraces } from "api/traces"

const TraceList: React.FC = () => {
  const [fetching, setFetching] = useState<boolean>(false)
  const [params, setParams] = useState<GetTracesParams>({
    offset: 0,
    limit: 20,
    method: "",
    pathRegex: "",
    hostRegex: "",
  })
  const [traces, setTraces] = useState<ApiTrace[]>([])

  const onFetchClick = () => {
    setFetching(true)
    getTraces(params)
      .then(e => setTraces(e))
      .catch(e => console.error(e))
      .finally(() => {
        setFetching(false)
      })
  }

  return (
    <PageWrapper title="Endpoints">
      <ContentContainer maxContentW="100rem" px="8" py="8">
        <VStack w="full" alignItems="flex-start" spacing="4">
          <Heading fontWeight="medium" size="lg" mb="4">
            Traces
          </Heading>
          <HStack>
            <Input
              placeholder="Method"
              value={params.method}
              onChange={e =>
                setParams(old => ({ ...old, method: e.target.value }))
              }
            />
            <Input
              placeholder="Host Regex"
              value={params.hostRegex}
              onChange={e =>
                setParams(old => ({ ...old, hostRegex: e.target.value }))
              }
            />
            <Input
              placeholder="Path Regex"
              value={params.pathRegex}
              onChange={e =>
                setParams(old => ({ ...old, pathRegex: e.target.value }))
              }
            />
            <Button w="lg" isLoading={fetching} onClick={() => onFetchClick()}>
              Fetch Traces
            </Button>
          </HStack>
          <Code w="full" p="8" overflowX="scroll">
            <pre>{JSON.stringify(traces, null, 4)}</pre>
          </Code>
        </VStack>
      </ContentContainer>
    </PageWrapper>
  )
}

export default TraceList
