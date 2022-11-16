import {
  Code,
  Box,
  VStack,
  Text,
  Select,
  Button,
  HStack,
  Badge,
} from "@chakra-ui/react"
import { CgArrowRight } from "@react-icons/all-files/cg/CgArrowRight"
import { ListNumber } from "components/utils/ListNumber"
import { useState } from "react"
import {
  getAWSIngestorLaunchStackURL,
  INGESTOR_AWS_REGIONS,
  getAWSDeployAmiURL,
} from "~/constants"

const AWSDocs = () => {
  const [selectedRegion, setSelectedRegion] = useState("us-west-2")
  const [deployRegion, setDeployRegion] = useState("us-west-2")
  const [manual, setManual] = useState(false)

  return (
    <>
      <VStack spacing={6} w="full">
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
            One Click Deploy
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
              <ListNumber num={1} title="Open Metlo Manager Ports">
                <Text>
                  Open Port 8081 on your Metlo instance to TCP Connections so
                  you can start collecting traffic data. It should be open to
                  any machines you want to collect traffic from.
                </Text>
              </ListNumber>
              <ListNumber num={2} title="Deploy a Metlo Mirroring Instance">
                Deploy Metlo:
                <HStack>
                  <Select
                    defaultValue={"us-west-2"}
                    w="200px"
                    onChange={e => setDeployRegion(e.target.value)}
                  >
                    {INGESTOR_AWS_REGIONS.map(e => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </Select>
                  <Button
                    as="a"
                    colorScheme="blue"
                    target="_blank"
                    rightIcon={<CgArrowRight />}
                    href={getAWSDeployAmiURL(deployRegion)}
                  >
                    Deploy
                  </Button>
                </HStack>
                <Text>
                  We have AMI&apos;s ready in different AWS Regions so you can
                  deploy right away. When setting up your instance open up port
                  4789 to UDP Connections.
                </Text>
                <Text>
                  Under Advanced details {">"} User Data paste the following{" "}
                  {"("}
                  replace YOUR_METLO_HOST and YOUR_METLO_API_KEY with the right
                  values
                  {")"}:
                </Text>
                <Code w={"full"} p={2}>
                  <VStack spacing={0}>
                    <Box w={"full"}>#!/bin/bash</Box>
                    <Box w={"full"}>
                      $ echo &quot;METLO_ADDR=http://{"<"}YOUR_METLO_HOST{">"}
                      :8081&quot; {">>"} /opt/metlo/credentials
                    </Box>
                    <Box w={"full"}>
                      $ echo &quot;METLO_KEY={"<"}YOUR_METLO_API_KEY{">"}&quot;
                      {">>"}
                      /opt/metlo/credentials
                    </Box>
                    <Box w={"full"}>
                      $ sudo systemctl enable metlo-ingestor.service
                    </Box>
                    <Box w={"full"}>
                      $ sudo systemctl start metlo-ingestor.service
                    </Box>
                  </VStack>
                </Code>
              </ListNumber>
              <ListNumber num={3} title="Get AWS API Keys">
                <Text>
                  To set up mirroring we need an API Key with the following
                  permissions:
                </Text>
                <Text>- AmazonEC2FullAccess</Text>
                <Text>- AmazonVPCFullAccess</Text>
              </ListNumber>
              <ListNumber num={4} title="Install Metlo's CLI Tool">
                <Text>
                  You can install metlo from npm by running the following:
                </Text>
                <Code w="full" p={2}>
                  $ npm i -g @metlo/cli
                </Code>
              </ListNumber>
              <ListNumber num={5} title="Set up Traffic Mirroring">
                <Text>To set up traffic mirroring run the following:</Text>
                <Code w={"full"} p={2}>
                  <VStack>
                    <Box w={"full"}>$ metlo traffic-mirror aws new</Box>
                    <Box w={"full"}>✔ Select your AWS region · us-west-2 ✔</Box>
                    <Box w={"full"}>
                      ✔ What type of source do you want to mirror? · instance
                    </Box>
                    <Box w={"full"}>
                      ✔ Enter the id of your source ·i-xxxxxxxxxxxxxxxxx
                    </Box>
                    <Box w={"full"}>Finding Source...</Box>
                    <Box w={"full"}>Success!</Box>
                    <Box w={"full"}>
                      ✔ Enter the id of your Metlo Mirroring Instance: ·
                      i-xxxxxxxxxxxxxxxxx
                    </Box>
                    <Box w={"full"}>Creating Mirror Session</Box>
                    <Box w={"full"}>... Success!</Box>
                  </VStack>
                </Code>
              </ListNumber>
            </>
          ) : (
            <>
              <ListNumber
                num={1}
                title="Deploy a Metlo Traffic Mirroring Instance"
              >
                <Text>
                  You can use one of our Cloud Formation stacks to deploy in the
                  region you would like to mirror.
                </Text>
                <HStack>
                  <Select
                    defaultValue={"us-west-2"}
                    w="200px"
                    onChange={e => setSelectedRegion(e.target.value)}
                  >
                    {INGESTOR_AWS_REGIONS.map(e => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </Select>
                  <Button
                    as="a"
                    colorScheme="blue"
                    target="_blank"
                    rightIcon={<CgArrowRight />}
                    href={getAWSIngestorLaunchStackURL(selectedRegion)}
                  >
                    Launch Stack
                  </Button>
                </HStack>
              </ListNumber>
              <ListNumber num={2} title="Install Metlo's CLI Tool">
                <Text>
                  Once the instance is created, you can start traffic mirroring
                  using Metlo&apos;s CLI Tool. You can install metlo from npm by
                  running the following:
                </Text>
                <Code w={"full"} p={2}>
                  $ npm i -g @metlo/cli
                </Code>
              </ListNumber>
              <ListNumber num={3} title="Set up Traffic Mirroring">
                <Text>To set up traffic mirroring run the following:</Text>
                <Code w={"full"} p={2}>
                  <VStack>
                    <Box w={"full"}>$ metlo traffic-mirror aws new</Box>
                    <Box w={"full"}>✔ Select your AWS region · us-west-2 ✔</Box>
                    <Box w={"full"}>
                      ✔ What type of source do you want to mirror? · instance
                    </Box>
                    <Box w={"full"}>
                      ✔ Enter the id of your source ·i-xxxxxxxxxxxxxxxxx
                    </Box>
                    <Box w={"full"}>Finding Source...</Box>
                    <Box w={"full"}>Success!</Box>
                    <Box w={"full"}>
                      ✔ Enter the id of your Metlo Mirroring Instance: ·
                      i-xxxxxxxxxxxxxxxxx
                    </Box>
                    <Box w={"full"}>Creating Mirror Session</Box>
                    <Box w={"full"}>... Success!</Box>
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

export default AWSDocs
