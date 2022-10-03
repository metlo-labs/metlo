import { useEffect, useRef, useState } from "react"
import {
  Box,
  Grid,
  GridItem,
  VStack,
  Text,
  Code,
  HStack,
  Badge,
  Textarea,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Spinner,
} from "@chakra-ui/react"
import lightTheme from "prism-react-renderer/themes/github"
import Highlight, { defaultProps } from "prism-react-renderer"
import { AlertType, SpecExtension, Status } from "@common/enums"
import { Alert, ApiTrace, MinimizedSpecContext } from "@common/types"
import { getDateTimeString } from "utils"
import { METHOD_TO_COLOR, STATUS_TO_COLOR } from "~/constants"
import TraceDetail from "components/Endpoint/TraceDetail"
import { getSpec } from "api/apiSpecs"
import Link from "next/link"

export interface SpecDiffContext {
  pathPointer: string[]
  trace: ApiTrace
}

export interface SensitiveQueryParamContext {
  trace: ApiTrace
}

export interface BasicAuthenticationContext {
  trace: ApiTrace
}

export interface SensitivePathParamContext {
  trace: ApiTrace
  pathTokenIdx: number
}

interface PiiDataContext {
  trace: ApiTrace
}

interface AlertDetailProps {
  alert: Alert
  resolutionMessage: string
  setResolutionMessage: React.Dispatch<React.SetStateAction<string>>
  providedSpecString?: string
  providedSpecExtension?: SpecExtension
}

interface MissingHSTSContext {
  trace: ApiTrace
}

const handleOpenApiSpec = (
  trace: ApiTrace,
  specString: string,
  specExtension: SpecExtension,
  pathPointer: string[],
  minimizedSpecContext: Record<string, MinimizedSpecContext>,
  scrollRef: React.MutableRefObject<any>,
): { leftPanel: any; rightPanel: any } => {
  let leftPanel = null
  let rightPanel = null
  let lineNumber = null
  if (specExtension && specString) {
    lineNumber = minimizedSpecContext?.[pathPointer.join(".")]?.lineNumber
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
            <TraceDetail trace={trace} alertModalView />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  )
  rightPanel = (
    <Box w="55%" h="full">
      <Box borderWidth={1} h="full">
        {specString ? (
          <Highlight
            {...defaultProps}
            theme={lightTheme}
            code={specString}
            language={specExtension || "json"}
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
                      lineProps.className = `${lineProps.className} highlight-line light`
                    }
                    return (
                      <pre
                        key={i.toString()}
                        style={{
                          textAlign: "left",
                          margin: "1em 0",
                          padding: "0.5em",
                          overflow: "scroll",
                        }}
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
        ) : (
          <Text>Related spec no longer exists or has been deleted.</Text>
        )}
      </Box>
    </Box>
  )
  return { rightPanel, leftPanel }
}

const showRightPanel = (type: AlertType) => {
  switch (type) {
    case AlertType.PII_DATA_DETECTED:
    case AlertType.QUERY_SENSITIVE_DATA:
    case AlertType.BASIC_AUTHENTICATION_DETECTED:
    case AlertType.UNSECURED_ENDPOINT_DETECTED:
    case AlertType.PATH_SENSITIVE_DATA:
    case AlertType.OPEN_API_SPEC_DIFF:
      return true
    case AlertType.NEW_ENDPOINT:
    default:
      return false
  }
}

export const AlertDetail: React.FC<AlertDetailProps> = ({
  alert,
  resolutionMessage,
  setResolutionMessage,
  providedSpecString,
  providedSpecExtension,
}) => {
  const [loadinSpec, setLoadingSpec] = useState(
    alert.type === AlertType.OPEN_API_SPEC_DIFF,
  )
  const [leftPanel, setLeftPanel] = useState(null)
  const [rightPanel, setRightPanel] = useState(null)
  const scrollRef = useRef(null)
  const topDivRef = useRef(null)

  const executeScroll = () => {
    scrollRef.current?.scrollIntoView()
    topDivRef.current?.scrollIntoView()
  }

  useEffect(() => {
    const fetchSpec = async () => {
      return await getSpec(alert.apiEndpoint.openapiSpecName)
    }

    const setPanels = async () => {
      switch (alert.type) {
        case AlertType.OPEN_API_SPEC_DIFF:
          const specContext = alert.context as SpecDiffContext
          const specTrace = specContext.trace
          const pathPointer = specContext.pathPointer
          let res: { leftPanel: any; rightPanel: any } = {
            leftPanel: null,
            rightPanel: null,
          }
          if (providedSpecString && providedSpecExtension) {
            res = handleOpenApiSpec(
              specTrace,
              providedSpecString,
              providedSpecExtension,
              pathPointer,
              alert.apiEndpoint.openapiSpec?.minimizedSpecContext,
              scrollRef,
            )
          } else {
            const fetchResp = await fetchSpec()
            res = handleOpenApiSpec(
              specTrace,
              fetchResp?.spec,
              fetchResp?.extension,
              pathPointer,
              alert.apiEndpoint.openapiSpec?.minimizedSpecContext,
              scrollRef,
            )
          }
          setLeftPanel(res.leftPanel)
          setRightPanel(res.rightPanel)
          setLoadingSpec(false)
          break
        case AlertType.UNAUTHENTICATED_ENDPOINT_SENSITIVE_DATA:
          setLeftPanel(
            <Box alignSelf="flex-start">
              <Link href={`/endpoint/${alert.apiEndpointUuid}?tab=fields`}>
                <Text as="button" fontWeight="semibold">
                  View Endpoint →
                </Text>
              </Link>
            </Box>,
          )
          break
        case AlertType.PII_DATA_DETECTED:
        case AlertType.QUERY_SENSITIVE_DATA:
        case AlertType.BASIC_AUTHENTICATION_DETECTED:
        case AlertType.UNSECURED_ENDPOINT_DETECTED:
        case AlertType.PATH_SENSITIVE_DATA:
          const context = alert.context as
            | PiiDataContext
            | SensitiveQueryParamContext
            | BasicAuthenticationContext
            | MissingHSTSContext
          const trace = context.trace
          setRightPanel(
            <Box w="55%" h="full">
              <VStack w="full" h="full" alignItems="flex-start">
                <Text fontWeight="semibold">Detected Trace</Text>
                <Box
                  overflowX="auto"
                  w="full"
                  bg="var(--chakra-colors-chakra-body-bg)"
                  h="calc(100% - 20px)"
                >
                  <TraceDetail trace={trace} />
                </Box>
              </VStack>
            </Box>,
          )
          break
        default:
      }
    }
    setPanels()
  }, [])

  useEffect(() => {
    if (showRightPanel(alert.type)) {
      executeScroll()
    }
  }, [rightPanel])

  return (
    <Box w="full" h="full">
      <HStack alignItems="flex-start" w="full" h="full" spacing="4">
        <VStack
          w={showRightPanel(alert.type) ? "45%" : "full"}
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
                  alert.status !== Status.RESOLVED
                    ? "Provide reason for resolving..."
                    : ""
                }
                onChange={e => setResolutionMessage(e.target.value)}
              />
            </VStack>
          )}
        </VStack>
        {loadinSpec ? (
          <Box
            w="55%"
            h="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Spinner size="xl" />
          </Box>
        ) : (
          rightPanel
        )}
      </HStack>
    </Box>
  )
}
