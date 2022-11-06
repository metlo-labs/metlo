import { Code, Heading, Box, Grid, VStack } from "@chakra-ui/react"
const NodeDocs = () => {
  return (
    <>
      <VStack w={"full"}>
        <Heading w={"full"} size={"md"} pb={4}>
          Installation
        </Heading>
        <Box w={"full"}>
          <VStack w={"full"}>
            <Box w={"full"}>
              Currently Metlo's Node Agent supports 3 frameworks:
            </Box>
            <Box w={"full"}>&nbsp;&nbsp;-&nbsp;Express</Box>
            <Box w={"full"}>&nbsp;&nbsp;-&nbsp;Koa</Box>
            <Box w={"full"}>&nbsp;&nbsp;-&nbsp;Fastify</Box>
            <Box w={"full"}>
              It can be installed from <Code>npm</Code> by running
            </Box>
            <Code w={"full"} p={2}>
              npm install melto
            </Code>
            <Box w={"full"}>
              It can be installed from <Code>yarn</Code> by running
            </Box>
            <Code w={"full"} p={2}>
              yarn add metlo
            </Code>
          </VStack>
        </Box>
        <Box w={"full"}>
          <Heading size={"md"} pb={4}>
            Configuration
          </Heading>
          <VStack w={"full"}>
            <VStack w={"full"} spacing={2}>
              <Box w={"full"}>
                Metlo can be added to any of the supported frameworks by adding
                the following lines as the start of your main script:
              </Box>
              <Code w={"full"} p={2}>
                <VStack w={"full"}>
                  <Box w={"full"}>var metlo = require("metlo")</Box>
                  <Box w={"full"}>
                    metlo({"<"}YOUR_METLO_API_KEY{">, <"}
                    YOUR_METLO_COLLECTOR_URL{">"})
                  </Box>
                </VStack>
              </Code>
            </VStack>
          </VStack>
        </Box>
      </VStack>
    </>
  )
}

export default NodeDocs