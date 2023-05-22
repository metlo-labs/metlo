import React from "react"
import { Code, Box, VStack } from "@chakra-ui/react"
import { DocsParams } from "./types"
import { ListNumber } from "components/utils/ListNumber"
import SyntaxHighlighter from "react-syntax-highlighter"

const NodeDocs: React.FC<DocsParams> = React.memo(({ apiKey, host }) => {
  return (
    <VStack w="full" spacing={6}>
      <ListNumber num={1} title="Install">
        <Box w="full">
          <VStack w="full">
            <Box w="full">
              Currently Metlo&apos;s Node Agent supports 3 frameworks:
            </Box>
            <Box w="full">&nbsp;&nbsp;-&nbsp;Express</Box>
            <Box w="full">&nbsp;&nbsp;-&nbsp;Koa</Box>
            <Box w="full">&nbsp;&nbsp;-&nbsp;Fastify</Box>
            <Box w="full">
              It can be installed from <Code>npm</Code> by running
            </Box>
            <Code w="full" p={2}>
              npm install metlo
            </Code>
            <Box w="full">
              It can be installed from <Code>yarn</Code> by running
            </Box>
            <Code w="full" p={2}>
              yarn add metlo
            </Code>
          </VStack>
        </Box>
      </ListNumber>
      <ListNumber num={2} title="Setup">
        <VStack w="full" spacing={2}>
          <Box w="full">
            Metlo can be added to any of the supported frameworks by adding the
            following lines as the start of your main script:
          </Box>
          <Code w="full" p={2}>
            <SyntaxHighlighter
              customStyle={{ background: "none", padding: 0 }}
              language="javascript"
            >
              {`import { initExpress as metlo } from "metlo";
// Or using require
const metlo = require("metlo").initExpress;
...
const app = express();
...
app.use(
  metlo(
    {
      key: "${apiKey}",
      host: "${host}",
    }
  )
);
`}
            </SyntaxHighlighter>
          </Code>
        </VStack>
      </ListNumber>
    </VStack>
  )
})

export default NodeDocs
