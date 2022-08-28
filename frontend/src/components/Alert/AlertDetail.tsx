import { useEffect, useRef, useState } from "react";
import { Modal, Box, Grid, GridItem, VStack, Text, Code, HStack, Badge , useColorMode, useColorModeValue, Textarea} from "@chakra-ui/react";
import jsonMap from "json-source-map"
import yaml from "js-yaml"
import SourceMap from "js-yaml-source-map"
import darkTheme from "prism-react-renderer/themes/duotoneDark"
import lightTheme from "prism-react-renderer/themes/github"
import Highlight, { defaultProps } from "prism-react-renderer"
import { AlertType, SpecExtension, Status } from "@common/enums";
import { Alert } from "@common/types"
import { getDateTimeString } from "utils"
import { METHOD_TO_COLOR, RISK_TO_COLOR, STATUS_TO_COLOR } from "~/constants"
import { SpecDiffContext } from "./AlertPanel";
import { TraceView } from "components/Endpoint/TraceDetail"

interface AlertDetailProps {
  alert: Alert
  resolutionMessage: string
  setResolutionMessage: React.Dispatch<React.SetStateAction<string>>
}

export const AlertDetail: React.FC<AlertDetailProps> = ({ alert, resolutionMessage, setResolutionMessage }) => {
  const colorMode = useColorMode().colorMode
  const theme = useColorModeValue(lightTheme, darkTheme)
  const panelColor = useColorModeValue("#F6F8FA", "#2A2734")
  const scrollRef = useRef(null)
  const topDivRef = useRef(null)
  let panel = null

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
      const context = alert.context as SpecDiffContext
      const trace = context.trace
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
        <HStack w="full" justifyContent="space-between">
          <Box w="50%">
            <Text mb="2" fontWeight="semibold">Spec</Text>
            <Box h="670px">
              <Highlight
                {...defaultProps}
                theme={theme}
                code={context.spec}
                language={context.specExtension || "json"}
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
                        maxHeight: "670px",
                        overflowY: "auto"
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
          <Box w="50%" >
            <Text fontWeight="semibold" mb="2">Differing Trace</Text>
            <Box maxH="670px" bg={panelColor} p="2" overflowY="auto">
              <VStack mb="4" h="full" w="full" alignItems="flex-start">
                <Text fontWeight="semibold">Request Path</Text>
                <Code rounded="md" p="2" fontSize="sm">{trace.path}</Code>
              </VStack>
              <TraceView trace={trace} colorMode={colorMode} />
            </Box>
          </Box>
        </HStack>
      )
      break
    default:
      panel = <Box></Box>
  }

  return (
    <Box w="full" h="full" overflowY="auto" ref={topDivRef}>
      <VStack w="full" spacing="4">
        <Grid w="full" templateColumns="1fr 1fr" gap="4">
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Status</Text>
              <Badge fontSize="sm" px="2" py="1" colorScheme={STATUS_TO_COLOR[alert.status]}>
                {alert.status}
              </Badge>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Time</Text>
              <Code p="1" rounded="md" fontSize="sm">
                {getDateTimeString(alert.createdAt)}
              </Code>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Endpoint</Text>
              <HStack>
                <Badge
                  fontSize="sm"
                  px="2"
                  py="1"
                  colorScheme={METHOD_TO_COLOR[alert.apiEndpoint.method] || "gray"}
                >
                  {alert.apiEndpoint.method.toUpperCase()}
                </Badge>
                <Code p="1" rounded="md" fontSize="sm">
                  {alert.apiEndpoint.path}
                </Code>
              </HStack>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Risk Score</Text>
              <Badge fontSize="sm" colorScheme={RISK_TO_COLOR[alert.riskScore]}>
                {alert.riskScore}
              </Badge>
            </VStack>
          </GridItem>
        </Grid>
        <VStack w="full" alignItems="flex-start">
            <Text fontWeight="semibold">Description</Text>
            <Code p="3" rounded="md" w="full" fontSize="sm">
              {alert.description}
            </Code>
          </VStack>
        {panel}
        {alert.status !== Status.IGNORED && <VStack w="full" alignItems="flex-start">
            <Text fontWeight="semibold">Resolution Reason</Text>
            <Textarea
              disabled={alert.status === Status.RESOLVED}
              _disabled={{
                opacity: 0.7,
                cursor: "not-allowed",
              }}
              value={resolutionMessage || ""}
              placeholder={
                alert.status !== Status.RESOLVED && "Provide reason for resolving..."
              }
              onChange={e => setResolutionMessage(e.target.value)}
            />
          </VStack>}
    </VStack>
    </Box>
  )
}
