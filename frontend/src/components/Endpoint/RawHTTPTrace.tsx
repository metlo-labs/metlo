import {
  Button,
  Code,
  Text,
  HStack,
  VStack,
  useClipboard,
} from "@chakra-ui/react"
import { ApiTrace } from "@common/types"

const traceToRawHttpReq = (trace: ApiTrace) => {
  let out: string[] = []
  out.push(`${trace.method} ${trace.path} HTTP/1.1\r\n`)
  out.push(trace.requestHeaders.map(e => `${e.name}: ${e.value}`).join("\r\n"))
  out.push("\r\n\r\n")
  out.push(
    typeof trace.requestBody == "object"
      ? JSON.stringify(trace.requestBody)
      : trace.requestBody,
  )
  return out.join("")
}

const traceToRawHttpResp = (trace: ApiTrace) => {
  let out: string[] = []
  out.push(
    `HTTP/1.1 ${trace.responseStatus} ${
      STATUS_CODE_MAP[trace.responseStatus.toString()] || ""
    }\r\n`,
  )
  out.push(trace.responseHeaders.map(e => `${e.name}: ${e.value}`).join("\r\n"))
  out.push("\r\n\r\n")
  out.push(
    typeof trace.responseBody == "object"
      ? JSON.stringify(trace.responseBody)
      : trace.responseBody,
  )
  return out.join("")
}

const RawItem = ({ title, val }: { title: string; val: string }) => {
  const { onCopy, hasCopied } = useClipboard(val)
  return (
    <VStack w="full" alignItems="flex-start" spacing="2">
      <HStack w="full" justifyContent="space-between">
        <Text fontWeight="semibold">{title}</Text>
        <Button size="xs" onClick={onCopy}>
          {hasCopied ? "Copied!" : "Copy"}
        </Button>
      </HStack>
      <Code w="full" p="2">
        <pre style={{ whiteSpace: "pre-wrap" }}>{val}</pre>
      </Code>
    </VStack>
  )
}

export const RawTraceView = ({ trace }: { trace: ApiTrace }) => (
  <VStack w="full" alignItems="flex-start" spacing="4">
    <RawItem title="Request" val={traceToRawHttpReq(trace)} />
    <RawItem title="Response" val={traceToRawHttpResp(trace)} />
  </VStack>
)

const STATUS_CODE_MAP = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
  "103": "Early Hints",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "203": "Non-Authoritative Information",
  "204": "No Content",
  "205": "Reset Content",
  "206": "Partial Content",
  "207": "Multi-Status",
  "208": "Already Reported",
  "226": "IM Used",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Found",
  "303": "See Other",
  "304": "Not Modified",
  "305": "Use Proxy",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "402": "Payment Required",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "406": "Not Acceptable",
  "407": "Proxy Authentication Required",
  "408": "Request Timeout",
  "409": "Conflict",
  "410": "Gone",
  "411": "Length Required",
  "412": "Precondition Failed",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "416": "Range Not Satisfiable",
  "417": "Expectation Failed",
  "418": "I'm a Teapot",
  "421": "Misdirected Request",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Too Early",
  "426": "Upgrade Required",
  "428": "Precondition Required",
  "429": "Too Many Requests",
  "431": "Request Header Fields Too Large",
  "451": "Unavailable For Legal Reasons",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
  "505": "HTTP Version Not Supported",
  "506": "Variant Also Negotiates",
  "507": "Insufficient Storage",
  "508": "Loop Detected",
  "509": "Bandwidth Limit Exceeded",
  "510": "Not Extended",
  "511": "Network Authentication Required",
}
