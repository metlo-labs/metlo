import React from "react"
import {
  Code,
  Box,
  VStack,
  Text,
  Button,
  HStack,
  Badge,
} from "@chakra-ui/react"
import { ListNumber } from "components/utils/ListNumber"
import { DocsParams } from "./types"

const BurpSuiteDocs: React.FC<DocsParams> = React.memo(({ host, apiKey }) => {
  return (
    <VStack w="full" spacing={6}>
      <ListNumber num={1} title="Install">
        <Box w="full">
          <VStack w="full" alignItems="flex-start">
            <Text w="full">
              The first step is to download Metlo{"'"}s Burp Suite extension:
            </Text>
            <Button>
              <a href="https://metlo-api-security-public.s3.us-west-2.amazonaws.com/metlo-burpsuite-plugin-latest.jar">
                Download Extension
              </a>
            </Button>
            <Text w="full">
              After that you can install the extension like usual. Instructions
              to do that can be found{" "}
              <a
                href="https://portswigger.net/burp/documentation/desktop/extensions/installing-extensions"
                target="_blank"
                rel="noreferrer"
              >
                here
              </a>
              .
            </Text>
          </VStack>
        </Box>
      </ListNumber>
      <ListNumber num={2} title="Setup">
        <Box w="full">
          <VStack w="full" alignItems="flex-start" spacing="4">
            <Text w="full">
              Once installed, go the the Metlo tab, and configure the{" "}
              <Code>METLO URL</Code>
              and <Code>API Key</Code> fields and press Save Config.
            </Text>
            <HStack spacing="4">
              <VStack alignItems="flex-start">
                <Badge fontSize="md">METLO URL</Badge>
                <Badge fontSize="md">API Key</Badge>
              </VStack>
              <VStack alignItems="flex-start">
                <Code fontSize="md">{host}</Code>
                <Code fontSize="md">{apiKey}</Code>
              </VStack>
            </HStack>
            <Text w="full">
              After this your traffic should be sent to Metlo!
            </Text>
          </VStack>
        </Box>
      </ListNumber>
    </VStack>
  )
})

export default BurpSuiteDocs
