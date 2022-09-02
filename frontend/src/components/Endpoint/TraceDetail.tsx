import React from "react"
import dynamic from "next/dynamic"
import {
  Badge,
  Box,
  Code,
  ColorMode,
  Grid,
  GridItem,
  HStack,
  Text,
  useColorMode,
  VStack,
} from "@chakra-ui/react"
import { ApiTrace } from "@common/types"
import { getDateTimeString } from "utils"
import { METHOD_TO_COLOR } from "~/constants"
import { statusCodeToColor } from "components/utils/StatusCode"
const ReactJson = dynamic(() => import("react-json-view"), { ssr: false })

interface TraceDetailProps {
  trace: ApiTrace
  alertModalView?: boolean
}

export const JSONContentViewer = (
  data: string,
  colorMode: ColorMode,
  collapsed?: number,
) => {
  const bgColor = colorMode === "dark" ? "#4C5564" : "#EDF2F7"
  try {
    return (
      <Box w="full" h="full" rounded="md" bgColor={bgColor}>
        <ReactJson
          theme={colorMode === "dark" ? "summerfruit" : "summerfruit:inverted"}
          src={JSON.parse(data)}
          name={false}
          indentWidth={2}
          enableClipboard={false}
          collapsed={collapsed ?? 1}
          style={{
            height: "100%",
            padding: "16px",
            overflow: "auto",
            maxHeight: "40vh",
            borderRadius: "0.375rem",
            backgroundColor: bgColor,
          }}
        />
      </Box>
    )
  } catch {
    return (
      <Code h="full" p="2" rounded="md" w="full">
        {data}
      </Code>
    )
  }
}

export const TraceView: React.FC<{ trace: ApiTrace; colorMode: ColorMode }> = ({
  trace,
  colorMode,
}) => (
  <VStack spacing="4" w="full" alignItems="flex-start">
    <VStack h="full" w="full" alignItems="flex-start">
      <Text fontWeight="semibold">Request Headers</Text>
      {JSONContentViewer(JSON.stringify(trace.requestHeaders || []), colorMode)}
    </VStack>
    <VStack h="full" w="full" alignItems="flex-start">
      <Text fontWeight="semibold">Request Parameters</Text>
      {JSONContentViewer(JSON.stringify(trace.requestParameters), colorMode)}
    </VStack>
    <VStack h="full" w="full" alignItems="flex-start">
      <Text fontWeight="semibold">Request Body</Text>
      {JSONContentViewer(trace.requestBody, colorMode)}
    </VStack>
    <VStack h="full" w="full" alignItems="flex-start">
      <Text fontWeight="semibold">Response Headers</Text>
      {JSONContentViewer(JSON.stringify(trace.responseHeaders), colorMode)}
    </VStack>
    <VStack w="full" alignItems="flex-start">
      <Text fontWeight="semibold">Response Body</Text>
      {JSONContentViewer(trace.responseBody, colorMode)}
    </VStack>
  </VStack>
)

const TraceDetail: React.FC<TraceDetailProps> = React.memo(
  ({ trace, alertModalView }) => {
    const colorMode = useColorMode()
    return (
      <Box
        w="full"
        h="full"
        overflowY="auto"
        p={alertModalView ? "0" : "4"}
        wordBreak={alertModalView ? "break-word" : "initial"}
      >
        <Grid templateColumns="1fr 1fr" gap="4">
          <GridItem colSpan={2}>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Endpoint</Text>
              <HStack>
                <Badge
                  fontSize="sm"
                  px="2"
                  py="1"
                  colorScheme={
                    statusCodeToColor(trace.responseStatus) || "gray"
                  }
                >
                  {trace.responseStatus}
                </Badge>
                <Badge
                  fontSize="sm"
                  px="2"
                  py="1"
                  colorScheme={METHOD_TO_COLOR[trace.method] || "gray"}
                >
                  {trace.method.toUpperCase()}
                </Badge>
                <Code p="1" fontSize="sm">
                  {trace.path}
                </Code>
              </HStack>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Time</Text>
              <Code p="1" fontSize="sm">
                {getDateTimeString(trace.createdAt)}
              </Code>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Host</Text>
              <Code p="1" fontSize="sm">
                {trace.host}
              </Code>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Source</Text>
              <Text
                fontFamily="mono"
                fontSize="sm"
              >{`${trace.meta.source}:${trace.meta.sourcePort}`}</Text>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Destination</Text>
              <Text
                fontFamily="mono"
                fontSize="sm"
              >{`${trace.meta.destination}:${trace.meta.destinationPort}`}</Text>
            </VStack>
          </GridItem>
        </Grid>
        <Box pt="4">
          <TraceView trace={trace} colorMode={colorMode.colorMode} />
        </Box>
      </Box>
    )
  },
)

export default TraceDetail
