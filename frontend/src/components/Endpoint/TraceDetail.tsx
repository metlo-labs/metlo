import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import {
  Badge,
  Box,
  Code,
  ColorMode,
  Grid,
  GridItem,
  Heading,
  HStack,
  Text,
  useColorMode,
  VStack,
} from "@chakra-ui/react"
import { ApiTrace, DataField } from "@common/types"
import { getDateTimeString } from "utils"
import { METHOD_TO_COLOR } from "~/constants"
import { statusCodeToColor } from "components/utils/StatusCode"
import { DataSection } from "@common/enums"
import {
  populateSensitiveData,
  NumSensitiveDataMap,
  SensitiveDataMap,
} from "./sensitive-data-utils"
import EmptyView from "components/utils/EmptyView"
const ReactJson = dynamic(() => import("@akshays/react-json-view"), {
  ssr: false,
})

interface TraceDetailProps {
  trace: ApiTrace
  alertModalView?: boolean
  attackView?: boolean
  dataFields?: DataField[]
}

export const JSONContentViewer = (
  data: string,
  colorMode: ColorMode,
  collapsed?: number,
  regexSenData?: [string, string[]][],
  regexNumSenDataMap?: Map<string, number>,
) => {
  let regexNumSenData: [string, number][] = []
  if (regexNumSenDataMap) {
    regexNumSenData = Array.from(regexNumSenDataMap, ([key, value]) => [
      key,
      value,
    ])
  }
  const bgColor = colorMode === "dark" ? "#4C5564" : "#EDF2F7"
  try {
    let parsedData: object
    if (!data) {
      throw new Error()
    }
    if (typeof data === "object") {
      parsedData = data
    } else {
      parsedData = JSON.parse(data ?? "{}")
      if (typeof parsedData !== "object" && !Array.isArray(parsedData)) {
        throw new Error()
      }
    }
    return (
      <Box w="full" h="full" rounded="md" bgColor={bgColor}>
        <ReactJson
          theme={colorMode === "dark" ? "summerfruit" : "summerfruit:inverted"}
          src={parsedData}
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
          regexToSensitiveData={regexSenData}
          regexToNumSensitiveData={regexNumSenData}
        />
      </Box>
    )
  } catch {
    return (
      <Code h="full" p="2" rounded="md" w="full">
        {`${data ?? ""}`}
      </Code>
    )
  }
}

export const TraceView: React.FC<{
  trace: ApiTrace
  dataFields?: DataField[]
  colorMode: ColorMode
}> = ({ trace, dataFields, colorMode }) => {
  const [sensitiveDataMap, setSensitiveDataMap] = useState<SensitiveDataMap>({})
  const [numSensitiveDataMap, setNumSensitiveDataMap] =
    useState<NumSensitiveDataMap>({})

  useEffect(() => {
    const calc = async () => {
      const res = await populateSensitiveData(trace, dataFields)
      setSensitiveDataMap(res.sensitiveDataMap)
      setNumSensitiveDataMap(res.numSensitiveDataMap)
    }
    calc()
  }, [trace, dataFields])

  const root = "^root$"
  const reqHeaderTotalSenData =
    numSensitiveDataMap[DataSection.REQUEST_HEADER]?.get(root)
  const reqQueryTotalSenData =
    numSensitiveDataMap[DataSection.REQUEST_QUERY]?.get(root)
  const reqBodyTotalSenData =
    numSensitiveDataMap[DataSection.REQUEST_BODY]?.get(root)
  const resHeaderTotalSenData =
    numSensitiveDataMap[DataSection.RESPONSE_HEADER]?.get(root)
  const resBodyTotalSenData =
    numSensitiveDataMap[DataSection.RESPONSE_BODY]?.get(root)
  return (
    <VStack spacing="4" w="full" alignItems="flex-start">
      <VStack h="full" w="full" alignItems="flex-start">
        <HStack>
          <Text fontWeight="semibold">Request Parameters </Text>
          {reqQueryTotalSenData && (
            <Text color="red.500">
              ({reqQueryTotalSenData} PII Field
              {reqQueryTotalSenData > 1 ? "s" : ""})
            </Text>
          )}
        </HStack>
        {JSONContentViewer(
          JSON.stringify(trace.requestParameters),
          colorMode,
          undefined,
          sensitiveDataMap[DataSection.REQUEST_QUERY],
          numSensitiveDataMap[DataSection.REQUEST_QUERY],
        )}
      </VStack>
      {trace.redacted ?? false ? (
        <EmptyView>
          <Heading
            size="md"
            fontWeight="semibold"
            textAlign="center"
            color="gray.400"
          >
            Enable Full Trace Capture for this Endpoint to see Request/Response
            Headers and Bodies
          </Heading>
        </EmptyView>
      ) : (
        <>
          <VStack h="full" w="full" alignItems="flex-start">
            <HStack>
              <Text fontWeight="semibold">Request Headers </Text>
              {reqHeaderTotalSenData && (
                <Text color="red.500">
                  ({reqHeaderTotalSenData} PII Field
                  {reqHeaderTotalSenData > 1 ? "s" : ""})
                </Text>
              )}
            </HStack>
            {JSONContentViewer(
              JSON.stringify(trace.requestHeaders || []),
              colorMode,
              undefined,
              sensitiveDataMap[DataSection.REQUEST_HEADER],
              numSensitiveDataMap[DataSection.REQUEST_HEADER],
            )}
          </VStack>
          <VStack h="full" w="full" alignItems="flex-start">
            <HStack>
              <Text fontWeight="semibold">Request Body </Text>
              {reqBodyTotalSenData && (
                <Text color="red.500">
                  ({reqBodyTotalSenData} PII Field
                  {reqBodyTotalSenData > 1 ? "s" : ""})
                </Text>
              )}
            </HStack>
            {JSONContentViewer(
              trace.requestBody,
              colorMode,
              undefined,
              sensitiveDataMap[DataSection.REQUEST_BODY],
              numSensitiveDataMap[DataSection.REQUEST_BODY],
            )}
          </VStack>
          <VStack h="full" w="full" alignItems="flex-start">
            <HStack>
              <Text fontWeight="semibold">Response Headers </Text>
              {resHeaderTotalSenData && (
                <Text color="red.500">
                  ({resHeaderTotalSenData} PII Field
                  {resHeaderTotalSenData > 1 ? "s" : ""})
                </Text>
              )}
            </HStack>
            {JSONContentViewer(
              JSON.stringify(trace.responseHeaders),
              colorMode,
              undefined,
              sensitiveDataMap[DataSection.RESPONSE_HEADER],
              numSensitiveDataMap[DataSection.RESPONSE_HEADER],
            )}
          </VStack>
          <VStack w="full" alignItems="flex-start">
            <HStack>
              <Text fontWeight="semibold">Response Body </Text>
              {resBodyTotalSenData && (
                <Text color="red.500">
                  ({resBodyTotalSenData} PII Field
                  {resBodyTotalSenData > 1 ? "s" : ""})
                </Text>
              )}
            </HStack>
            {JSONContentViewer(
              trace.responseBody,
              colorMode,
              undefined,
              sensitiveDataMap[DataSection.RESPONSE_BODY],
              numSensitiveDataMap[DataSection.RESPONSE_BODY],
            )}
          </VStack>
        </>
      )}
    </VStack>
  )
}

const TraceDetail: React.FC<TraceDetailProps> = React.memo(
  ({ trace, alertModalView, attackView, dataFields }) => {
    const colorMode = useColorMode()
    return (
      <Box
        w="full"
        h="full"
        overflowY="auto"
        p={alertModalView ? "0" : "4"}
        wordBreak={alertModalView ? "break-word" : "initial"}
      >
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap="4">
          <GridItem colSpan={{ base: "auto", lg: 2 }}>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Endpoint</Text>
              <HStack alignItems="flex-start">
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
                <Code wordBreak="break-all" p="1" fontSize="sm">
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
          {trace.originalHost ? (
            <GridItem>
              <VStack alignItems="flex-start">
                <Text fontWeight="semibold">Original Host</Text>
                <Code p="1" fontSize="sm">
                  {trace.originalHost}
                </Code>
              </VStack>
            </GridItem>
          ) : null}
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
          {attackView && (
            <>
              <GridItem>
                <VStack alignItems="flex-start">
                  <Text fontWeight="semibold">Authentication Provided</Text>
                  <Text fontFamily="mono" fontSize="sm">{`${
                    trace.sessionMeta?.authenticationProvided ?? "N/A"
                  }`}</Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack alignItems="flex-start">
                  <Text fontWeight="semibold">Authentication Successful</Text>
                  <Text fontFamily="mono" fontSize="sm">{`${
                    trace.sessionMeta?.authenticationSuccessful ?? "N/A"
                  }`}</Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack alignItems="flex-start">
                  <Text fontWeight="semibold">Auth Type</Text>
                  <Text fontFamily="mono" fontSize="sm">
                    {trace.sessionMeta?.authType ?? "N/A"}
                  </Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack alignItems="flex-start">
                  <Text fontWeight="semibold">User</Text>
                  <Text fontFamily="mono" fontSize="sm">
                    {trace.sessionMeta?.user ?? "N/A"}
                  </Text>
                </VStack>
              </GridItem>
            </>
          )}
        </Grid>
        <Box pt="4">
          <TraceView
            trace={trace}
            colorMode={colorMode.colorMode}
            dataFields={dataFields}
          />
        </Box>
      </Box>
    )
  },
)

export default TraceDetail
