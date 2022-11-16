import { Code, Box, VStack, Text } from "@chakra-ui/react"
import { ListNumber } from "components/utils/ListNumber"
const GCPDocs = () => {
  return (
    <>
      <VStack w={"full"} spacing={6}>
      <ListNumber num={1} title="Install Metlo's CLI Tool">
          <Text>You can install metlo from npm by running the following:</Text>
          <Code w={"full"} p={2}>
            $ npm i -g @metlo/cli
          </Code>
        </ListNumber>
        <ListNumber num={2} title="Set up Traffic Mirroring">
          <Text>To set up traffic mirroring run the following:</Text>
          <Code w={"full"} p={2}>
            <VStack>
              <Box w={"full"}>$ metlo traffic-mirror gcp new</Box>
              <Box w={"full"}>✔ GCP Project Name · metlo-security</Box>
              <Box w={"full"}>✔ GCP Network to mirror · default</Box>
              <Box w={"full"}>✔ Select your GCP zone · us-central1-a</Box>
              <Box w={"full"}>
                ✔ Path to GCP key file ·{"<"}PATH TO GCP KEY FILE{">"}
              </Box>
              <Box w={"full"}>✔ Validated account details</Box>
              <Box w={"full"}>Validated account details succesfully</Box>
              <Box w={"full"}>✔ Select your mirror source type · SUBNET</Box>
              <Box w={"full"}>
                ✔ Enter the mirror source subnet name · default
              </Box>
              <Box w={"full"}>✔ Verified mirror source details</Box>
              <Box w={"full"}>✔ Created destination subnet</Box>
              <Box w={"full"}>✔ Created Firewall rule</Box>
              <Box w={"full"}>✔ Obtained router details</Box>
              <Box w={"full"}>✔ Mirror Instance Type · e2-standard-2</Box>
              <Box w={"full"}>
                ✔ Metlo URL · {"<"}METLO_URL_HERE{">"}
              </Box>
              <Box w={"full"}>
                ✔ Metlo API Key · {"<"}METLO_API_KEY_HERE{">"}
              </Box>
              <Box w={"full"}>✔ Created MIG for metlo</Box>
              <Box w={"full"}>✔ Created health check</Box>
              <Box w={"full"}>
                ✔ Creating Backend service for packet mirroring
              </Box>
              <Box w={"full"}>✔ Created load balancer</Box>
              <Box w={"full"}>✔ Started packet mirroring</Box>
            </VStack>
          </Code>
        </ListNumber>
      </VStack>
    </>
  )
}

export default GCPDocs
