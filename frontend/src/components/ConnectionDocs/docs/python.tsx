import React from "react"
import { Code, Heading, Box, VStack } from "@chakra-ui/react"
import { DocsParams } from "./types"
import { ListNumber } from "components/utils/ListNumber"
import SyntaxHighlighter from "react-syntax-highlighter"

const PythonDocs: React.FC<DocsParams> = ({ host, apiKey }) => {
  return (
    <VStack w="full" spacing={6}>
      <ListNumber num={1} title="Install">
        <Box w="full">
          <VStack w="full">
            <Box w="full">
              Currently Metlo&apos;s Python Agent supports 2 servers:
            </Box>
            <Box w="full">&nbsp;&nbsp;-&nbsp;Django</Box>
            <Box w="full">&nbsp;&nbsp;-&nbsp;Flask</Box>
            <Box w="full">It can be installed from pypi by running :</Box>
            <Code w="full" p={2}>
              <SyntaxHighlighter
                customStyle={{ background: "none", padding: 0 }}
                language="bash"
              >
                $ pip install metlo
              </SyntaxHighlighter>
            </Code>
          </VStack>
        </Box>
      </ListNumber>
      <ListNumber num={2} title="Setup">
        <VStack w="full" spacing="6">
          <VStack w="full">
            <Heading size="sm" w="full">
              Django
            </Heading>
            <Box w="full">
              Metlo&apos;s middleware can be added by modifying middlewares list
              (in the projects settings.py):
            </Box>
            <Code w="full" p={2}>
              <SyntaxHighlighter
                customStyle={{ background: "none", padding: 0 }}
                language="python"
              >
                {`MIDDLEWARE = [
    ...,
    "metlo.django.MetloDjango",
] `}
              </SyntaxHighlighter>
            </Code>
            <Box w="full">
              and configuring a METLO_CONFIG attribute in the projects
              settings.py:
              <Code p={2} w="full">
                <SyntaxHighlighter
                  customStyle={{ background: "none", padding: 0 }}
                  language="python"
                >
                  {`METLO_CONFIG = {
    "API_KEY": "${apiKey}",
    "METLO_HOST": "${host}"
}`}
                </SyntaxHighlighter>
              </Code>
            </Box>
            METLO_CONFIG can take an optional key-value pair representing the
            max number of workers for communicating with Metlo.
          </VStack>
          <VStack w="full">
            <Heading size="sm" w="full" mb="0">
              Flask
            </Heading>
            <Code p={2} w="full">
              <SyntaxHighlighter
                customStyle={{ background: "none", padding: 0 }}
                language="python"
              >
                {`from flask import Flask

from metlo.flask import MetloFlask

app = Flask(__name__)
MetloFlask(app, "${host}", "${apiKey}")`}
              </SyntaxHighlighter>
            </Code>
          </VStack>
        </VStack>
      </ListNumber>
    </VStack>
  )
}

export default PythonDocs
