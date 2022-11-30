import React from "react"
import {
  Code,
  Box,
  VStack,
  Text,
  ListItem,
  UnorderedList,
} from "@chakra-ui/react"
import SyntaxHighlighter from "react-syntax-highlighter"
import { ListNumber } from "components/utils/ListNumber"
import { DocsParams } from "./types"

const GoDocs: React.FC<DocsParams> = React.memo(({ host, apiKey }) => {
  return (
    <VStack w="full" spacing={6}>
      <ListNumber num={1} title="Install">
        <Box w="full">
          <VStack w="full">
            <Box w="full">
              Metlo for Golang has two components, the Metlo agent and
              instrumentation for your specific frameworks(s). To install the
              Metlo agent, run:
            </Box>
            <Code w="full" p={2}>
              <SyntaxHighlighter
                customStyle={{ background: "none", padding: 0 }}
                language="bash"
              >
                go get github.com/metlo-labs/metlo/ingestors/golang/metlo
              </SyntaxHighlighter>
            </Code>
            <Box w="full">
              After that you have to install the instrumentation for your
              framework. We currently support the following frameworks:
            </Box>
            <Box w="full" pt="2">
              <Text fontWeight="semibold">Gin</Text>
            </Box>
            <Code w="full" p={2}>
              <SyntaxHighlighter
                customStyle={{ background: "none", padding: 0 }}
                language="bash"
              >
                go get github.com/metlo-labs/metlo/ingestors/golang/gin
              </SyntaxHighlighter>
            </Code>
            <Box w="full" pt="2">
              <Text fontWeight="semibold">Gorilla/Mux</Text>
            </Box>
            <Code w="full" p={2}>
              <SyntaxHighlighter
                customStyle={{ background: "none", padding: 0 }}
                language="bash"
              >
                go get github.com/metlo-labs/metlo/ingestors/golang/gorilla
              </SyntaxHighlighter>
            </Code>
          </VStack>
        </Box>
      </ListNumber>
      <ListNumber num={2} title="Setup">
        <VStack w="full">
          <Code w="full" p={2}>
            <SyntaxHighlighter
              customStyle={{ background: "none", padding: 0 }}
              language="go"
            >
              {`import (
    "net/http"
    ...

    "github.com/metlo-labs/metlo/ingestors/golang/metlo"
    <EXPORT_NAME> "github.com/metlo-labs/metlo/ingestors/golang/<FRAMEWORK_NAME>"
)

func main() {
    metlo := metlo.InitMetlo("${host}", "${apiKey}")
    instrumentation := <EXPORT_NAME>.Init(metlo)

    r.Use(instrumentation.Middleware)
    ...
}`}
            </SyntaxHighlighter>
          </Code>
        </VStack>
      </ListNumber>
      <ListNumber num={3} title="Configure">
        <VStack w="full">
          <Box w="full">
            Metlo Custom initialization allows for modifying two extra
            parameters.
          </Box>
          <Code w="full" p={2}>
            <SyntaxHighlighter
              customStyle={{ background: "none", padding: 0 }}
              language="go"
            >
              {`InitMetloCustom(metloHost string, metloKey string, rps int, disable bool)`}
            </SyntaxHighlighter>
          </Code>
          <UnorderedList w="full" pl="4" pt="2">
            <ListItem>
              <Code>rps</Code> (default: 10 rps): Max requests per second to
              Metlo.
            </ListItem>
            <ListItem>
              <Code>disable</Code> (default: 10 false): To disable trace capture
              in certain scenarios.
            </ListItem>
          </UnorderedList>
        </VStack>
      </ListNumber>
    </VStack>
  )
})

export default GoDocs
