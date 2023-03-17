import React from "react"
import { Code, Box, VStack, Text } from "@chakra-ui/react"
import SyntaxHighlighter from "react-syntax-highlighter"
import { ListNumber } from "components/utils/ListNumber"
import { DocsParams } from "./types"

const DockerComposeDocs: React.FC<DocsParams> = React.memo(
  ({ host, apiKey }) => {
    return (
      <VStack w="full" spacing={6}>
        <ListNumber num={1} title="Add Agent">
          <Box w="full">
            <VStack w="full">
              <Text w="full">
                If you’re app is deployed using docker compose you can add Metlo
                as a service to capture API traffic data as shown below:
              </Text>
              <Code w="full" p={2}>
                <SyntaxHighlighter
                  customStyle={{ background: "none", padding: 0 }}
                  language="yaml"
                >
                  {`version: "3.9"
services:
  <your-service>:
    ...
  metlo:
    image: metlo/agent
    network_mode: "service:<your-service>"
    depends_on:
      - <your-service>
    cap_add:
      - NET_ADMIN
    environment:
      - METLO_HOST=${host}
      - METLO_KEY=${apiKey}`}
                </SyntaxHighlighter>
              </Code>
              <VStack w="full" alignItems="start">
                <Text>
                  Be sure to set the <Code>network_mode</Code> to{" "}
                  <Code>{`"service:<your-service>"`}</Code> so Metlo can reuse
                  your service’s network stack and listen to API traffic.
                </Text>
                <Text>
                  By default Metlo automatically detects the interface to listen
                  to but you can specify the INTERFACE environment variable if
                  you want to change it.
                </Text>
              </VStack>
            </VStack>
          </Box>
        </ListNumber>
      </VStack>
    )
  },
)

export default DockerComposeDocs
