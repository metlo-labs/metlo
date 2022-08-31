import {
  Box,
  useColorMode,
  useColorModeValue,
  VStack,
  Text,
  Badge,
  HStack,
  Code,
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
import { Alert } from "@common/types"
import { METHOD_TO_COLOR, RISK_TO_COLOR } from "~/constants"
import { getDateTimeString } from "utils"
import { SpecDiffContext } from "./AlertDetail"

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
      const context = alert.context as SpecDiffContext
      let range = 5
      if (context.specExtension) {
        switch (context.specExtension) {
          case SpecExtension.JSON:
            const result = jsonMap.parse(context.spec)
            let pathKey = ""
            for (let i = 0; i < context.pathPointer?.length; i++) {
              let pathToken = context.pathPointer[i]
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
            yaml.load(context.spec, { listener: map.listen() })
            lineNumber = map.lookup(context.pathPointer).line
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
            code={context.spec}
            language={context.specExtension || "json"}
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
                        key={i}
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
                              key={key}
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
