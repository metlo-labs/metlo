import { useState } from "react"
import { Code, Box, VStack, Text, HStack, Badge } from "@chakra-ui/react"
import { ListNumber } from "components/utils/ListNumber"
const GCPDocs = () => {
  const [manual, setManual] = useState(false)
  return (
    <>
      <VStack w={"full"} spacing={6}>
        <HStack spacing="0" width="full" alignItems="start">
          <Badge
            as="button"
            onClick={() => setManual(false)}
            roundedLeft="md"
            p="1"
            borderWidth="2px 1px 2px 2px"
            colorScheme={manual ? "none" : "gray"}
            opacity={manual ? 0.5 : 1}
            rounded="none"
          >
            Easy Deploy
          </Badge>
          <Badge
            as="button"
            onClick={() => setManual(true)}
            roundedRight="md"
            p="1"
            borderWidth="2px 2px 2px 1px"
            colorScheme={manual ? "gray" : "none"}
            opacity={manual ? 1 : 0.5}
            rounded="none"
          >
            Manual Deploy
          </Badge>
        </HStack>
        <VStack w="full" alignItems="start" spacing="8">
          {manual ? (
            <>
              <ListNumber num={1} title="Open Ports">
                <Text>
                  Open Port 8081 on your Metlo instance so you can start
                  collecting traffic data. It should be open to any machines you
                  want to collect traffic from.
                </Text>
              </ListNumber>
              <ListNumber num={2} title="Deploy a Metlo Mirroring Instance">
                <Text>Run the following command to spin up Metlo in GCP:</Text>
                <Code w={"full"} p={2}>
                  <VStack>
                    <Box w={"full"}>
                      $ export PROJECT_ID={'"<'}YOUR_PROJECT_ID{'>"'}
                    </Box>
                    <Box w={"full"}>
                      $ gcloud compute instances create metlo-api-security
                      --image-family=metlo-api-security
                      --image-project=metlo-security --project=$PROJECT_ID
                      --machine-type e2-standard-2
                    </Box>
                  </VStack>
                </Code>
                <Text>
                  Once you&apos;ve launched your instance run the following in
                  the instance to start Metlo:
                </Text>
                <Code w="full" p={2}>
                  $ sudo metlo start
                </Code>
              </ListNumber>
              <ListNumber num={3} title="Account Permissions">
                <Text>
                  Metlo mirroring on GCP requires a service account with the
                  following permissions:
                </Text>
                <Text>
                  Currently, we require these permissions for the service
                  account:
                </Text>
                <Text>&nbsp;-&nbsp;Compute Admin</Text>
                <Text>&nbsp;-&nbsp;Compute packet mirroring admin</Text>
                <Text>&nbsp;-&nbsp;Compute packet mirroring user</Text>
                <Text>&nbsp;-&nbsp;IAP-secured Tunnel User</Text>
              </ListNumber>
              <ListNumber num={4} title="Install Metlo's CLI Tool">
                <Text>
                  You can install metlo from npm by running the following:
                </Text>
                <Code w={"full"} p={2}>
                  $ npm i -g @metlo/cli
                </Code>
              </ListNumber>
              <ListNumber num={5} title="Set up Traffic Mirroring">
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
                    <Box w={"full"}>
                      ✔ Select your mirror source type · SUBNET
                    </Box>
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
            </>
          ) : (
            <>
              <ListNumber num={1} title="Install Metlo's CLI Tool">
                <Text>
                  You can install metlo from npm by running the following:
                </Text>
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
                    <Box w={"full"}>
                      ✔ Select your mirror source type · SUBNET
                    </Box>
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
            </>
          )}
        </VStack>
      </VStack>
    </>
  )
}

export default GCPDocs
