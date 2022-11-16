import {
  Code,
  Box,
  VStack,
  Text,
  Select,
  Button,
  HStack,
} from "@chakra-ui/react"
import { CgArrowRight } from "@react-icons/all-files/cg/CgArrowRight"
import { ListNumber } from "components/utils/ListNumber"
import { useState } from "react"
import { getAWSIngestorLaunchStackURL, INGESTOR_AWS_REGIONS } from "~/constants"

const AWSDocs = () => {
  const [selectedRegion, setSelectedRegion] = useState("us-west-2")
  return (
    <>
      <VStack spacing={6} w="full">
        <ListNumber num={1} title="Deploy a Metlo Traffic Mirroring Instance">
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
            Once the instance is created, you can start traffic mirroring using
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
