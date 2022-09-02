import { useEffect, useRef } from "react"
import {
  Box,
  Grid,
  GridItem,
  VStack,
  Text,
  Code,
  HStack,
  Badge,
  useColorMode,
  useColorModeValue,
  Textarea,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
} from "@chakra-ui/react"
import jsonMap from "json-source-map"
import yaml from "js-yaml"
import SourceMap from "js-yaml-source-map"
import darkTheme from "prism-react-renderer/themes/duotoneDark"
import lightTheme from "prism-react-renderer/themes/github"
import Highlight, { defaultProps } from "prism-react-renderer"
import { AlertType, SpecExtension, Status } from "@common/enums"
import { Alert, ApiTrace } from "@common/types"
import { getDateTimeString } from "utils"
import { METHOD_TO_COLOR, STATUS_TO_COLOR } from "~/constants"
import TraceDetail from "components/Endpoint/TraceDetail"

export interface SpecDiffContext {
  pathPointer: string[]
  spec: string
  specExtension: SpecExtension
  trace: ApiTrace
}

export interface SensitiveQueryParamContext {
  trace: ApiTrace
}

interface PiiDataContext {
  trace: ApiTrace
}

interface AlertDetailProps {
  alert: Alert
  resolutionMessage: string
  setResolutionMessage: React.Dispatch<React.SetStateAction<string>>
}

export const AlertDetail: React.FC<AlertDetailProps> = ({
  alert,
  resolutionMessage,
  setResolutionMessage,
}) => {
  const colorMode = useColorMode().colorMode
  const theme = useColorModeValue(lightTheme, darkTheme)
  const scrollRef = useRef(null)
  const topDivRef = useRef(null)
  let leftPanel = null
  let rightPanel = null

  const executeScroll = () => {
    scrollRef.current?.scrollIntoView()
    topDivRef.current?.scrollIntoView()
  }

  useEffect(() => {
    executeScroll()
  }, [])

  switch (alert.type) {
    case AlertType.OPEN_API_SPEC_DIFF:
      let lineNumber = null
      const contextSpec = alert.context as SpecDiffContext
      const traceSpec = contextSpec.trace
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
      leftPanel = (
        <Box w="full">
          <Accordion allowToggle={true}>
            <AccordionItem border="0" w="full">
              <AccordionButton _hover={{ bg: "transparent" }} p="0" mb="3">
                <AccordionIcon mr="3" />
                <Box fontWeight="semibold" flex="1" textAlign="left">
                  Differing Trace
                </Box>
              </AccordionButton>
              <AccordionPanel
                borderRadius={4}
                borderWidth={1}
                bg="var(--chakra-colors-chakra-body-bg)"
              >
                <TraceDetail trace={traceSpec} alertModalView />
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Box>
      )
      rightPanel = (
        <Box w="55%" h="full">
          <Box borderWidth={1} h="full">
            <Highlight
              {...defaultProps}
              theme={theme}
              code={contextSpec.spec}
              language={contextSpec.specExtension || "json"}
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => {
                return (
                  <pre
                    className={className}
                    style={{
                      ...style,
                      fontSize: "14px",
                      padding: "8px",
                      overflowX: "auto",
                      minHeight: "100%",
                      maxHeight: "100%",
                      overflowY: "auto",
                      background: "var(--chakra-colors-chakra-body-bg)",
                    }}
                  >
                    {tokens.map((line, i) => {
                      const lineProps = getLineProps({ line, key: i })
                      if (i + 1 === lineNumber) {
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
                          ref={i + 1 === lineNumber ? scrollRef : null}
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
                            {i + 1}
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
        </Box>
      )
      break
    case AlertType.PII_DATA_DETECTED:
    case AlertType.QUERY_SENSITIVE_DATA:
      const contextPii = alert.context as
        | PiiDataContext
        | SensitiveQueryParamContext
      const tracePii = contextPii.trace
      rightPanel = (
        <Box w="55%" h="full">
          <VStack w="full" h="full" alignItems="flex-start">
            <Text fontWeight="semibold">Detected Trace</Text>
            <Box
              overflowX="auto"
              w="full"
              bg="var(--chakra-colors-chakra-body-bg)"
              h="calc(100% - 20px)"
            >
              <TraceDetail trace={tracePii} />
            </Box>
          </VStack>
        </Box>
      )
      break
    default:
  }

  return (
    <Box w="full" h="full">
      <HStack alignItems="flex-start" w="full" h="full" spacing="4">
        <VStack
          w={rightPanel ? "45%" : "full"}
          h="full"
          overflowY="auto"
          spacing="4"
          pr="2"
        >
          <Grid w="full" templateColumns="1fr 1fr" gap="4">
            <GridItem>
              <VStack alignItems="flex-start">
                <Text fontWeight="semibold">Status</Text>
                <Badge
                  fontSize="sm"
                  px="2"
                  py="1"
                  colorScheme={STATUS_TO_COLOR[alert.status]}
                >
                  {alert.status}
                </Badge>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack alignItems="flex-start">
                <Text fontWeight="semibold">Created At</Text>
                <Code p="1" rounded="md" fontSize="sm">
                  {getDateTimeString(alert.createdAt)}
                </Code>
              </VStack>
            </GridItem>
            <GridItem colSpan={2}>
              <VStack alignItems="flex-start">
                <Text fontWeight="semibold">Endpoint</Text>
                <HStack>
                  <Badge
                    fontSize="sm"
                    px="2"
                    py="1"
                    colorScheme={
                      METHOD_TO_COLOR[alert.apiEndpoint.method] || "gray"
                    }
                  >
                    {alert.apiEndpoint.method.toUpperCase()}
                  </Badge>
                  <Code p="1" rounded="md" fontSize="sm">
                    {alert.apiEndpoint.path}
                  </Code>
                </HStack>
              </VStack>
            </GridItem>
          </Grid>
          <VStack w="full" alignItems="flex-start">
            <Text fontWeight="semibold">Description</Text>
            <Code p="3" rounded="md" w="full" fontSize="sm">
              {alert.description}
            </Code>
          </VStack>
          {leftPanel}
          {alert.status !== Status.IGNORED && (
            <VStack w="full" alignItems="flex-start">
              <Text fontWeight="semibold">Resolution Reason</Text>
              <Textarea
                bg="var(--chakra-colors-chakra-body-bg)"
                disabled={alert.status === Status.RESOLVED}
                _disabled={{
                  opacity: 0.7,
                  cursor: "not-allowed",
                }}
                value={resolutionMessage || ""}
                placeholder={
                  alert.status !== Status.RESOLVED &&
                  "Provide reason for resolving..."
                }
                onChange={e => setResolutionMessage(e.target.value)}
              />
            </VStack>
          )}
        </VStack>
        {rightPanel}
      </HStack>
    </Box>
  )
}
