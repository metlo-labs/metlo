import {
  Code,
  Heading,
  Box,
  Grid,
  VStack,
} from "@chakra-ui/react"
const AWSDocs = () => {
  return (
    <>
      <Heading size={"md"}>Supported Instances :</Heading>
      AWS is particular about what kind of instances are supported for
      mirroring. You can find exact information about supported instances here,
      but TL;DR, most current generation systems are supported, save for some
      select systems like T2.
      <br />
      <Heading size={"md"}>Steps</Heading>
      <VStack>
        <Box w={"full"}>
          <Heading size={"sm"}>1. Open Metlo Manager Ports</Heading>
          Open Port 8081 on your Metlo instance to TCP Connections so you can
          start collecting traffic data. It should be open to any machines you
          want to collect traffic from.
        </Box>
        <Box w={"full"}>
          <Heading size={"sm"}>2. Deploy a Metlo Mirroring Instance</Heading>
          <Grid
            templateColumns={{ sm: "repeat(4,1fr)", base: "repeat(2,1fr)" }}
            gridGap={4}
            w={"full"}
          >
            <Box>
              <a
                href="https://backend.metlo.com/traffic-mirror/aws?region=us-west-1"
                target="_self"
              >
                <img
                  src="https://metlo-api-security-public.s3.us-west-2.amazonaws.com/aws-deploy-us-west-1-light.svg"
                  height="50px"
                />
              </a>
            </Box>
            <Box>
              <a
                href="https://backend.metlo.com/traffic-mirror/aws?region=us-west-2"
                target="_self"
              >
                <img
                  src="https://metlo-api-security-public.s3.us-west-2.amazonaws.com/aws-deploy-us-west-2-light.svg"
                  height="50px"
                />
              </a>
            </Box>
            <Box>
              <a
                href="https://backend.metlo.com/traffic-mirror/aws?region=us-east-1"
                target="_self"
              >
                <img
                  src="https://metlo-api-security-public.s3.us-west-2.amazonaws.com/aws-deploy-us-east-1-light.svg"
                  height="50px"
                />
              </a>
            </Box>

            <Box>
              <a
                href="https://backend.metlo.com/traffic-mirror/aws?region=us-east-2"
                target="_self"
              >
                <img
                  src="https://metlo-api-security-public.s3.us-west-2.amazonaws.com/aws-deploy-us-east-2-light.svg"
                  height="50px"
                />
              </a>
            </Box>
          </Grid>
          <VStack>
            <Box>
              We have AMI's ready in different AWS Regions so you can deploy
              right away. When setting up your instance open up port 4789 to UDP
              Connections.
            </Box>
            <Box>
              Under Advanced details {">"} User Data paste the following {"("}
              replace YOUR_METLO_HOST and YOUR_METLO_API_KEY with the right
              values
              {")"}:
            </Box>
          </VStack>
          <Code w={"full"}>
            <VStack spacing={0}>
              <Box w={"full"}>#!/bin/bash</Box>
              <Box w={"full"}>
                echo "METLO_ADDR=http://{"<"}YOUR_METLO_HOST{">"}":8081" {">>"}{" "}
                /opt/metlo/credentials
              </Box>
              <Box w={"full"}>
                echo "METLO_KEY= {"<"}YOUR_METLO_API_KEY{">"} {">>"}{" "}
                /opt/metlo/credentials
              </Box>
              <Box w={"full"}>sudo systemctl enable metlo-ingestor.service</Box>
              <Box w={"full"}>sudo systemctl start metlo-ingestor.service</Box>
            </VStack>
          </Code>
        </Box>
        <Box w={"full"}>
          <Heading size={"sm"}>3. Get AWS API Keys</Heading>
          To set up mirroring we need an API Key with the following permissions:
          <br /> - AmazonEC2FullAccess
          <br /> - AmazonVPCFullAccess
        </Box>
        <Box w={"full"}>
          <Heading size={"sm"}>4. Instal Metlo's CLI Tool</Heading>
          You can install metlo from npm by running the following: $ npm i -g
          @metlo/cli
        </Box>
        <Box w={"full"}>
          <Heading size={"sm"}>5. Set up Traffic Mirroring</Heading>
          To set up traffic mirroring run the following:
          <Code w={"full"}>
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
