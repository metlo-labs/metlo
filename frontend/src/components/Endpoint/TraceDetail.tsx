import React, { useMemo } from "react"
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
import MIMEType from "whatwg-mimetype"
import { ApiTrace, DataField } from "@common/types"
import { getDateTimeString } from "utils"
import { METHOD_TO_COLOR } from "~/constants"
import { statusCodeToColor } from "components/utils/StatusCode"
import { DataSection } from "@common/enums"
const ReactJson = dynamic(() => import("@akshays/react-json-view"), {
  ssr: false,
})

interface TraceDetailProps {
  trace: ApiTrace
  alertModalView?: boolean
  attackView?: boolean
  dataFields?: DataField[]
}

interface NumSensitiveData {
  pathTokens: string[]
  arrayFields: Record<string, number>
  dataSection: DataSection
}

type SensitiveDataMap = Record<string, [string, string[]][]>

type NumSensitiveDataMap = Record<string, Map<string, number>>

const getMimeType = (contentType: string) => {
  try {
    return new MIMEType(contentType)
  } catch (err) {
    return null
  }
}

const getSensitiveDataRegex = (
  pathTokens: string[],
  arrayFields: Record<string, number>,
  providedPrefix?: string,
  skipArray?: boolean,
) => {
  let replacedString = ""
  let fullString = providedPrefix ?? ""
  if (
    providedPrefix &&
    pathTokens.length === 0 &&
    Object.keys(arrayFields).length > 0
  ) {
    pathTokens = [""]
  }
  for (let j = 0; j < pathTokens.length; j++) {
    const token = pathTokens[j]
    fullString += token
    let arrayString = ""
    if (!skipArray && arrayFields[fullString]) {
      const depth = arrayFields[fullString]
      for (let i = 0; i < depth; i++) {
        arrayString += "[0-9]+"
        if (i !== depth - 1) {
          arrayString += String.raw`\.`
        }
      }
    }
    if (!arrayString && providedPrefix && j == 0) {
      replacedString += String.raw`\.`
    }
    replacedString += String.raw`${token}`
    if (arrayString) {
      replacedString += String.raw`\.${arrayString}`
    }
    if (j !== pathTokens.length - 1) {
      fullString += "."
      replacedString += String.raw`\.`
    }
  }
  return replacedString
}

const getPairObjectData = (dataSection: DataSection, trace: ApiTrace) => {
  switch (dataSection) {
    case DataSection.REQUEST_QUERY:
      return trace.requestParameters
    case DataSection.REQUEST_HEADER:
      return trace.requestHeaders
    case DataSection.RESPONSE_HEADER:
      return trace.responseHeaders
    default:
      return []
  }
}

const getContentTypes = (trace: ApiTrace) => {
  let reqContentType = "*/*"
  let respContentType = "*/*"
  trace.requestHeaders.forEach(e => {
    if (e.name.toLowerCase() == "content-type") {
      const mimeType = getMimeType(e.value)
      if (mimeType.essence) {
        reqContentType = mimeType.essence
      }
    }
  })
  trace.responseHeaders.forEach(e => {
    if (e.name.toLowerCase() == "content-type") {
      const mimeType = getMimeType(e.value)
      if (mimeType.essence) {
        respContentType = mimeType
      }
    }
  })
  return { reqContentType, respContentType }
}

const getNumSensitiveData = (
  numSensitiveData: NumSensitiveData[],
  numSensitiveDataMap: NumSensitiveDataMap,
) => {
  const root = String.raw`^root$`
  for (const item of numSensitiveData) {
    const tokens = item.pathTokens
    const tokensLength = tokens.length
    const sectionMap = numSensitiveDataMap[item.dataSection]
    for (let i = 0; i < tokensLength; i++) {
      const tmpPathTokens = tokens.slice(0, i + 1)
      const regex = getSensitiveDataRegex(
        tmpPathTokens,
        item.arrayFields,
        undefined,
        true,
      )
      const regexString = new RegExp(String.raw`^root\.${regex}$`).source
      if (!sectionMap.has(regexString)) {
        sectionMap.set(regexString, 1)
      } else {
        sectionMap.set(regexString, sectionMap.get(regexString) + 1)
      }
    }
    if (!sectionMap.has(root)) {
      sectionMap.set(root, 1)
    } else {
      sectionMap.set(root, sectionMap.get(root) + 1)
    }
  }
}

const populateSensitiveData = (trace: ApiTrace, dataFields: DataField[]) => {
  const sensitiveDataMap = {
    [DataSection.REQUEST_QUERY]: [],
    [DataSection.REQUEST_HEADER]: [],
    [DataSection.REQUEST_BODY]: [],
    [DataSection.RESPONSE_HEADER]: [],
    [DataSection.RESPONSE_BODY]: [],
  }
  const numSensitiveData: NumSensitiveData[] = []
  const numSensitiveDataMap = {
    [DataSection.REQUEST_QUERY]: new Map<string, number>(),
    [DataSection.REQUEST_HEADER]: new Map<string, number>(),
    [DataSection.REQUEST_BODY]: new Map<string, number>(),
    [DataSection.RESPONSE_HEADER]: new Map<string, number>(),
    [DataSection.RESPONSE_BODY]: new Map<string, number>(),
  }

  const { reqContentType, respContentType } = getContentTypes(trace)
  for (const dataField of dataFields) {
    const isRespBody = dataField.dataSection === DataSection.RESPONSE_BODY
    const isRespHeader = dataField.dataSection === DataSection.RESPONSE_HEADER
    const isReqBody = dataField.dataSection === DataSection.REQUEST_BODY
    const nonFilterSection = !isReqBody && !isRespHeader && !isRespHeader
    const isPairObjectSection =
      dataField.dataSection === DataSection.REQUEST_QUERY ||
      dataField.dataSection === DataSection.REQUEST_HEADER ||
      dataField.dataSection === DataSection.RESPONSE_HEADER
    if (
      (nonFilterSection ||
        (isRespBody &&
          dataField.contentType === respContentType &&
          dataField.statusCode === trace.responseStatus) ||
        (isReqBody && dataField.contentType === reqContentType) ||
        (isRespHeader && dataField.statusCode === trace.responseStatus)) &&
      dataField.dataClasses.length > 0
    ) {
      let prefix = `^root\.`
      let regex = ""
      let pathTokens = dataField.dataPath.split(".")
      if (isPairObjectSection) {
        const pairName = pathTokens[0]
        const traceData = getPairObjectData(dataField.dataSection, trace)
        let index = null
        for (let i = 0; i < traceData.length; i++) {
          if (traceData[i].name === pairName) {
            index = i
            break
          }
        }
        if (index) {
          pathTokens = pathTokens.slice(1, pathTokens.length)
          const tmpSenDataPrefix = String.raw`${index}\.value`
          const tmpRegex = getSensitiveDataRegex(
            pathTokens,
            dataField.arrayFields,
            `${pairName}`,
          )
          regex = tmpSenDataPrefix + tmpRegex
          if (pathTokens.length > 0) {
            pathTokens = [`${index}`, "value", ...pathTokens]
          } else if (Object.keys(dataField.arrayFields).length > 0) {
            pathTokens = [`${index}`, "value"]
          } else {
            pathTokens = [`${index}`]
          }
        }
      } else {
        regex = getSensitiveDataRegex(pathTokens, dataField.arrayFields)
      }
      const regexString = new RegExp(String.raw`${prefix}${regex}$`).source
      sensitiveDataMap[dataField.dataSection].push([
        regexString,
        dataField.dataClasses,
      ])

      numSensitiveData.push({
        pathTokens,
        arrayFields: dataField.arrayFields,
        dataSection: dataField.dataSection,
      })
    }
  }
  getNumSensitiveData(numSensitiveData, numSensitiveDataMap)
  return { sensitiveDataMap, numSensitiveDataMap }
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
  const { sensitiveDataMap, numSensitiveDataMap } = useMemo(
    () => populateSensitiveData(trace, dataFields),
    [trace.uuid],
  )
  const root = "^root$"
  const reqHeaderTotalSenData =
    numSensitiveDataMap[DataSection.REQUEST_HEADER].get(root)
  const reqQueryTotalSenData =
    numSensitiveDataMap[DataSection.REQUEST_QUERY].get(root)
  const reqBodyTotalSenData =
    numSensitiveDataMap[DataSection.REQUEST_BODY].get(root)
  const resHeaderTotalSenData =
    numSensitiveDataMap[DataSection.RESPONSE_HEADER].get(root)
  const resBodyTotalSenData =
    numSensitiveDataMap[DataSection.RESPONSE_BODY].get(root)
  return (
    <VStack spacing="4" w="full" alignItems="flex-start">
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
