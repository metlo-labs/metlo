import {
  Code,
  Heading,
  Box,
  VStack,
  Text,
  Select,
  Button,
  HStack,
} from "@chakra-ui/react"
import { ListNumber } from "components/utils/ListNumber"
import { useRouter } from "next/router"
import { useState } from "react"
import { getAWSIngestorLaunchStackURL, INGESTOR_AWS_REGIONS } from "~/constants"

const AWSDocs = () => {
  const [selectedRegion, setSelectedRegion] = useState("us-west-2")
  const router = useRouter()
  return (
    <>
      <VStack spacing={6} w="full">
        <ListNumber num={1} title="Use one of our Launch Stacks">
          <Text>
            The launch stack will create an instance with suricata ingestor
            installed and security groups with ports 22 and 4789. You will have
            to select your VPC, the key-pair to access the instance running
            Metlo, the host address where your Metlo instance resides, and the
            API Key for the Metlo collector.
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
              href={getAWSIngestorLaunchStackURL(selectedRegion)}
            >
              Launch Stack
            </Button>
          </HStack>
        </ListNumber>
        <ListNumber num={2} title="Install Metlo's CLI Tool">
          <Text>
            Once the instance is created, connect to the instance to install
            Metlo&apos;s CLI Tool. You can install metlo from npm by running the
            following:
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
      </VStack>
    </>
  )
}

export default AWSDocs
