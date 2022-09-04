import {
  Box,
  useColorMode,
  useColorModeValue,
  VStack,
  Text,
  Badge,
  HStack,
  Code,
  Wrap,
  WrapItem,
} from "@chakra-ui/react"
import { TiFlowSwitch } from "@react-icons/all-files/ti/TiFlowSwitch"
import { useRouter } from "next/router"
import jsonMap from "json-source-map"
import yaml from "js-yaml"
import SourceMap from "js-yaml-source-map"
import darkTheme from "prism-react-renderer/themes/duotoneDark"
import lightTheme from "prism-react-renderer/themes/github"
import Highlight, { defaultProps } from "prism-react-renderer"
import { AlertType, SpecExtension } from "@common/enums"
import { getPathTokens } from "@common/utils"
import { Alert } from "@common/types"
import { METHOD_TO_COLOR, RISK_TO_COLOR } from "~/constants"
import { getDateTimeString } from "utils"
import {
  SpecDiffContext,
  SensitiveQueryParamContext,
  BasicAuthenticationContext,
  SensitivePathParamContext,
} from "./AlertDetail"
import { JSONContentViewer } from "components/Endpoint/TraceDetail"

interface AlertPanelProps {
  alert: Alert
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alert }) => {
  const colorMode = useColorMode().colorMode
  const theme = useColorModeValue(lightTheme, darkTheme)
  const panelColor = useColorModeValue("#F6F8FA", "#2A2734")
  const router = useRouter()
  let panel = null

  switch (alert.type) {
    case AlertType.OPEN_API_SPEC_DIFF:
      let lineNumber = null
      const contextSpec = alert.context as SpecDiffContext
      let range = 5
      if (contextSpec.specExtension) {
        switch (contextSpec.specExtension) {
          case SpecExtension.JSON:
            const result = jsonMap.parse(contextSpec.spec)
            let pathKey = ""
            for (let i = 0; i < contextSpec.pathPointer?.length; i++) {
              let pathToken = contextSpec.pathPointer[i]
              pathToken = pathToken.replaceAll("/", "~1")
              pathKey += `/${pathToken}`
            }
            lineNumber = result.pointers?.[pathKey]?.key?.line
            if (lineNumber) {
              lineNumber += 1
            }
            break
          case SpecExtension.YAML:
            const map = new SourceMap()
            yaml.load(contextSpec.spec, { listener: map.listen() })
            lineNumber = map.lookup(contextSpec.pathPointer).line
            if (lineNumber) {
              lineNumber -= 1
            }
            break
          default:
            break
        }
      }
      panel = (
        <Box w="full">
          <Highlight
            {...defaultProps}
            theme={theme}
            code={contextSpec.spec}
            language={contextSpec.specExtension || "json"}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => {
              tokens = tokens.filter(
                (line, i) => i >= lineNumber - range && i <= lineNumber + range,
              )
              const startLine = lineNumber - range
              return (
                <pre
                  className={className}
                  style={{
                    ...style,
                    fontSize: "14px",
                    padding: "8px",
                    overflowX: "hidden",
                    minHeight: "100%",
                  }}
                >
                  {tokens.map((line, i) => {
                    const lineProps = getLineProps({ line, key: i })
                    if (startLine + i + 1 === lineNumber) {
                      lineProps.className = `${lineProps.className} highlight-line ${colorMode}`
                    }
                    return (
                      <pre
                        style={{
                          textAlign: "left",
                          margin: "1em 0",
                          padding: "0.5em",
                          overflow: "scroll",
                        }}
                        key={i.toString()}
                        {...lineProps}
                      >
                        <span
                          style={{
                            display: "table-cell",
                            textAlign: "right",
                            paddingRight: "1em",
                            userSelect: "none",
                            opacity: "0.5",
                          }}
                        >
                          {startLine + i + 1}
                        </span>
                        <span style={{ display: "table-cell" }}>
                          {line.map((token, key) => (
                            <span
                              key={key.toString()}
                              {...getTokenProps({ token, key })}
                            />
                          ))}
                        </span>
                      </pre>
                    )
                  })}
                </pre>
              )
            }}
          </Highlight>
        </Box>
      )
      break
    case AlertType.QUERY_SENSITIVE_DATA:
      const contextSensitiveQuery = alert.context as SensitiveQueryParamContext
      const traceSensitiveQuery = contextSensitiveQuery.trace
      panel = (
        <Box w="full" pb="4">
          {JSONContentViewer(
            JSON.stringify(traceSensitiveQuery.requestParameters),
            colorMode,
            3,
          )}
        </Box>
      )
      break
    case AlertType.BASIC_AUTHENTICATION_DETECTED:
      const contextBasicAuth = alert.context as BasicAuthenticationContext
      const traceBasicAuthHeaders = contextBasicAuth.trace
      panel = (
        <Box w="full" pb="4">
          {JSONContentViewer(
            JSON.stringify(traceBasicAuthHeaders.requestHeaders),
            colorMode,
            3,
          )}
        </Box>
      )
      break
    case AlertType.PATH_SENSITIVE_DATA:
      const contextSensitivePath = alert.context as SensitivePathParamContext
      const tracePath = contextSensitivePath.trace.path
      const tokenIdx = contextSensitivePath.pathTokenIdx
      const tracePathTokens = getPathTokens(tracePath)
      panel = (
        <Box w="full" pb="4">
          <Code fontSize="lg" rounded="md" textTransform="none" p="3">
            <Wrap spacing="2">
              {tracePathTokens.map((token, idx) => (
                <WrapItem key={idx}>
                  <Text mr="2">/</Text>
                  {idx === tokenIdx ? (
                    <Badge colorScheme="red" fontSize="lg">
                      {token}
                    </Badge>
                  ) : (
                    <Text>{token}</Text>
                  )}
                </WrapItem>
              ))}
            </Wrap>
          </Code>
        </Box>
      )
      break
    default:
      panel = <Box></Box>
  }

  return (
    <VStack
      borderTopWidth={1}
      borderBottomWidth={1}
      w="full"
      h="full"
      p="8"
      bg={panelColor}
    >
      {panel}
      <Box
        borderWidth={1}
        rounded="sm"
        bg="var(--chakra-colors-chakra-body-bg)"
        borderLeftWidth={5}
        borderLeftColor={RISK_TO_COLOR[alert.riskScore]}
        p="4"
        w="full"
      >
        <VStack alignItems="flex-start" w="full" h="full">
          <HStack w="full" justifyContent="space-between">
            <Text>{alert.description}</Text>
            <Code p="1" alignSelf="flex-start">
              {getDateTimeString(alert.createdAt)}
            </Code>
          </HStack>
          <HStack
            w="full"
            cursor="pointer"
            onClick={() => router.push(`/endpoint/${alert.apiEndpoint.uuid}`)}
          >
            <TiFlowSwitch fontSize={25} />
            <Badge
              fontSize="sm"
              px="2"
              py="1"
              colorScheme={METHOD_TO_COLOR[alert.apiEndpoint.method] || "gray"}
            >
              {alert.apiEndpoint.method}
            </Badge>
            <Code p="1">{alert.apiEndpoint.path}</Code>
          </HStack>
        </VStack>
      </Box>
    </VStack>
  )
}
