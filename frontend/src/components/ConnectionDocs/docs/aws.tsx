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
import { useRouter } from "next/router"
import { useState } from "react"
const AWSDocs = () => {
  const [selectedRegion, setSelectedRegion] = useState("")
  const router = useRouter()
  return (
    <>
      <VStack spacing={6}>
        <Box w={"full"}>
          <Heading size={"md"}>Supported Instances:</Heading>
          <Text pb={4}>
            AWS is particular about what kind of instances are supported for
            mirroring. You can find exact information about supported instances
            here, but TL;DR, most current generation systems are supported, save
            for some select systems like T2.
          </Text>
          <Box w={"full"}>
            <Heading size={"md"}>Steps</Heading>
          </Box>
        </Box>

        <Box w={"full"}>
          <Heading size={"sm"} paddingBlock={2}>
            1. Open Metlo Manager Ports
          </Heading>
          Open Port 8081 on your Metlo instance to TCP Connections so you can
          start collecting traffic data. It should be open to any machines you
          want to collect traffic from.
        </Box>
        <VStack w={"full"}>
          <Heading size={"sm"} paddingBlock={2} w={"full"}>
            2. Deploy a Metlo Mirroring Instance
          </Heading>
          <VStack w={"full"}>
            <Box w={"full"}>Deploy Metlo:</Box>
            <Box w={"full"}>
              <HStack w={{ lg: "40%", base: "full" }}>
                <Select
                  onChange={v => setSelectedRegion(v.target.value)}
                  defaultValue={""}
                  w={"full"}
                >
                  <option selected disabled value={""}>
                    Select AWS Region
                  </option>
                  <option value="https://backend.metlo.com/traffic-mirror/aws?region=us-west-1">
                    Deploy to us-west-1
                  </option>
                  <option value="https://backend.metlo.com/traffic-mirror/aws?region=us-west-2">
                    Deploy to us-west-2
                  </option>
                  <option value="https://backend.metlo.com/traffic-mirror/aws?region=us-east-1">
                    Deploy to us-east-1
                  </option>
                  <option value="https://backend.metlo.com/traffic-mirror/aws?region=us-east-2">
                    Deploy to us-west-1
                  </option>
                </Select>
                <Button
                  as="a"
                  target={"_blank"}
                  disabled={selectedRegion === ""}
                  href={selectedRegion}
                >
                  Deploy
                </Button>
              </HStack>
            </Box>
          </VStack>
          <VStack w={"full"} paddingBlock={2}>
            <Box w={"full"}>
              We have AMI&apos;s ready in different AWS Regions so you can
              deploy right away. When setting up your instance open up port 4789
              to UDP Connections.
            </Box>
            <Box w={"full "}>
              Under Advanced details {">"} User Data paste the following {"("}
              replace YOUR_METLO_HOST and YOUR_METLO_API_KEY with the right
              values
              {")"}:
            </Box>
          </VStack>
          <Code w={"full"} p={2}>
            <VStack spacing={0}>
              <Box w={"full"}>#!/bin/bash</Box>
              <Box w={"full"}>
                echo &quot;METLO_ADDR=http://{"<"}YOUR_METLO_HOST{">"}
                :8081&quot; {">>"} /opt/metlo/credentials
              </Box>
              <Box w={"full"}>
                echo &quot;METLO_KEY={"<"}YOUR_METLO_API_KEY{">"}&quot;{">>"}
                /opt/metlo/credentials
              </Box>
              <Box w={"full"}>sudo systemctl enable metlo-ingestor.service</Box>
              <Box w={"full"}>sudo systemctl start metlo-ingestor.service</Box>
            </VStack>
          </Code>
        </VStack>
        <Box w={"full"}>
          <Heading size={"sm"} paddingBlock={2}>
            3. Get AWS API Keys
          </Heading>
          To set up mirroring we need an API Key with the following permissions:
          <br /> - AmazonEC2FullAccess
          <br /> - AmazonVPCFullAccess
        </Box>
        <VStack w={"full"}>
          <Heading size={"sm"} paddingBlock={2} w={"full"}>
            4. Instal Metlo&apos;s CLI Tool
          </Heading>
          You can install metlo from npm by running the following:
          <Code w={"full"} p={2}>
            $ npm i -g @metlo/cli
          </Code>
        </VStack>
        <Box w={"full"}>
          <Heading size={"sm"} paddingBlock={2}>
            5. Set up Traffic Mirroring
          </Heading>
          To set up traffic mirroring run the following:
          <Code w={"full"} p={2}>
            <VStack>
              <Box w={"full"}>$ metlo traffic-mirror aws</Box>
              <Box w={"full"}>✔ Select your AWS region · us-west-2 ✔</Box>
              <Box w={"full"}>
                Enter your AWS Access Key ID · {"<YOUR_AWS_ACCESS_KEY_ID>"}
              </Box>
              <Box w={"full"}>
                ✔ Enter your AWS Secret Access Key ·
                {" <YOUR_AWS_SECRET_ACCESS_KEY>"}
              </Box>
              <Box w={"full"}>Verifying Keys... </Box>
              <Box w={"full"}>Success!</Box>
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
        </Box>
      </VStack>
    </>
  )
}

export default AWSDocs
