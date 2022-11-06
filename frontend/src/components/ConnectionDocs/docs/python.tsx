import { Code, Heading, Box, Grid, VStack } from "@chakra-ui/react"
const PythonDocs = () => {
  return (
    <>
      <VStack w={"full"}>
        <Heading w={"full"} size={"md"} pb={4}>
          Installation
        </Heading>
        <Box w={"full"}>
          <VStack w={"full"}>
            <Box w={"full"}>
              Currently Metlo&apos;s Python Agent supports 2 servers:
            </Box>
            <Box w={"full"}>&nbsp;&nbsp;-&nbsp;Django</Box>
            <Box w={"full"}>&nbsp;&nbsp;-&nbsp;Flask</Box>
            <Box w={"full"}>It can be installed from pypi by running :</Box>
            <Code w={"full"} p={2}>
              pip install metlo
            </Code>
          </VStack>
        </Box>
        <Box w={"full"}>
          <Heading size={"md"} pb={4}>
            Configuration
          </Heading>
          <VStack w={"full"}>
            <VStack w={"full"} spacing={2}>
              <Heading size={"sm"} w={"full"}>
                Django
              </Heading>
              <Box w={"full"}>
                Once installed, Metlo&apos;s middleware can be added by
                modifying middlewares list (in the projects settings.py) like
                so:
              </Box>
              <Code w={"full"} p={2}>
                <VStack w={"full"}>
                  <Box w={"full"}>MIDDLEWARE = [</Box>
                  <Box w={"full"}>&nbsp;&nbsp;&nbsp;&nbsp;...,</Box>
                  <Box w={"full"}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&quot;metlo.django.MetloDjango&quot;,
                  </Box>
                  <Box w={"full"}>]</Box>
                </VStack>
              </Code>
              <Box w={"full"}>
                and configuring a METLO_CONFIG attribute in the projects
                settings.py like this :
                <Code p={2} w={"full"}>
                  <VStack w={"full"}>
                    <Box w={"full"}>METLO_CONFIG = {"{"}</Box>
                    <Box w={"full"}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&quot;API_KEY&quot;:
                      {"<YOUR_METLO_API_KEY>"},
                    </Box>
                    <Box w={"full"}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&quot;METLO_HOST&quot;:
                      {"<YOUR_METLO_COLLECTOR_URL>"}
                    </Box>
                    <Box w={"full"}>{"}"}</Box>
                  </VStack>
                </Code>
              </Box>
              METLO_CONFIG can take an optional key-value pair representing the
              max number of workers for communicating with Metlo.
            </VStack>
            <VStack spacing={2}>
              <Heading size={"sm"} w={"full"}>
                Flask
              </Heading>
              <VStack w={"full"}>
                <Box w={"full"}>
                  Once installed, METLO middleware can be added simply like :
                </Box>
                <Code p={2} w={"full"}>
                  <VStack w={"full"}>
                    <Box w={"full"}>from flask import Flask</Box>
                    <Box w={"full"}>from metlo.flask import MetloFlask</Box>
                    <Box w={"full"}>app = Flask(__name__)</Box>
                    <Box w={"full"}>
                      MetloFlask(app, {'"<'}YOUR_METLO_COLLECTOR_URL{'>", "<'}
                      YOUR_METLO_API_KEY{'>"'})
                    </Box>
                  </VStack>
                </Code>
                <Box w={"full"}>
                  The Flask Middleware takes the flask app, METLO collector url,
                  and the METLO API Key as parameters. As an optional parameter,
                  a named value can be passed for max number of workers for
                  communicating with METLO.
                </Box>
                <Code p={2} w={"full"}>
                  MetloFlask(app, {'"<'}YOUR_METLO_COLLECTOR_URL{'>", "<'}
                  YOUR_METLO_API_KEY{'>",'} workers={'"<'}WORKER-COUNT{'>"'})
                </Code>
              </VStack>
            </VStack>
          </VStack>
        </Box>
      </VStack>
    </>
  )
}

export default PythonDocs
