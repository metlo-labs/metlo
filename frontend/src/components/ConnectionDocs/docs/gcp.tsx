import React from "react"
import { Code, Box, VStack, Text } from "@chakra-ui/react"
import { ListNumber } from "components/utils/ListNumber"
import { DocsParams } from "./types"
import SyntaxHighlighter from "react-syntax-highlighter"

const GCPDocs: React.FC<DocsParams> = React.memo(({apiKey, host}) => {
  return (
    <>
      <VStack w="full" spacing={6}>
        <ListNumber num={1} title="Create a Service Account">
          <Text>
            Metlo mirroring on GCP requires a service account with the following
            permissions:
          </Text>
          <Text>- Compute Admin</Text>
          <Text>- Compute packet mirroring admin</Text>
          <Text>- Compute packet mirroring user</Text>
          <Text>- IAP-secured Tunnel User</Text>
        </ListNumber>
        <ListNumber num={2} title="Install Metlo's CLI Tool">
          <Text>You can install metlo from npm by running the following:</Text>
          <Code w="full" p={2}>
                <SyntaxHighlighter
                  customStyle={{ background: "none", padding: 0 }}
                  language="bash"
                >{`$ npm i -g @metlo/cli`}</SyntaxHighlighter>
          </Code>
        </ListNumber>
        <ListNumber num={3} title="Set up Traffic Mirroring">
          <Text>To set up traffic mirroring run the following:</Text>
          <Code w="full" p={2}>
            <VStack>
              <Box w="full">$ metlo traffic-mirror gcp new</Box>
              <Box w="full">✔ GCP Project Name · metlo-security</Box>
              <Box w="full">✔ GCP Network to mirror · default</Box>
              <Box w="full">✔ Select your GCP zone · us-central1-a</Box>
              <Box w="full">
                ✔ Path to GCP key file ·{"<"}PATH TO GCP KEY FILE{">"}
              </Box>
              <Box w="full">✔ Validated account details</Box>
              <Box w="full">Validated account details succesfully</Box>
              <Box w="full">✔ Select your mirror source type · SUBNET</Box>
              <Box w="full">
                ✔ Enter the mirror source subnet name · default
              </Box>
              <Box w="full">✔ Verified mirror source details</Box>
              <Box w="full">✔ Created destination subnet</Box>
              <Box w="full">✔ Created Firewall rule</Box>
              <Box w="full">✔ Obtained router details</Box>
              <Box w="full">✔ Mirror Instance Type · e2-standard-2</Box>
              <Box w="full">
                ✔ Metlo URL · {host}
              </Box>
              <Box w="full">
                ✔ Metlo API Key · {apiKey}
              </Box>
              <Box w="full">✔ Created MIG for metlo</Box>
              <Box w="full">✔ Created health check</Box>
              <Box w="full">
                ✔ Creating Backend service for packet mirroring
              </Box>
              <Box w="full">✔ Created load balancer</Box>
              <Box w="full">✔ Started packet mirroring</Box>
            </VStack>
          </Code>
        </ListNumber>
      </VStack>
    </>
  )
})

export default GCPDocs
