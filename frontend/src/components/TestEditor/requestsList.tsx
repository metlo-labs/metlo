import React, { useState } from "react"
import {
  Box,
  HStack,
  VStack,
  StackProps,
  Button,
  Text,
  Spinner,
} from "@chakra-ui/react"
import { IoMdTrash } from "icons/io/IoMdTrash"
import { FiPlus } from "icons/fi/FiPlus"
import { Request } from "@metlo/testing"
import { METHOD_TO_COLOR } from "~/constants"
import { BiCheckCircle } from "icons/bi/BiCheckCircle"
import { GiCancel } from "icons/gi/GiCancel"

interface RequestListProps extends StackProps {
  endpointHost: string
  requests: Request[]
  fetching: boolean[]
  selectedRequest: number
  updateSelectedRequest: (e: number) => void
  addNewRequest: () => void
  deleteRequest: (e: number) => void
}

interface RequestItemProps {
  endpointHost: string
  fetching: boolean
  request: Request
  selectedRequest: number
  idx: number
  updateSelectedRequest: (e: number) => void
  deleteRequest: (e: number) => void
}

export const processTemplate = (base: string, envVars: Map<string, string>) => {
  for (let [key, value] of envVars) {
    base = base.replace(`{{${key}}}`, value)
  }
  return base
}

const RequestItem: React.FC<RequestItemProps> = React.memo(
  ({
    fetching,
    endpointHost,
    request,
    selectedRequest,
    idx,
    updateSelectedRequest,
    deleteRequest,
  }) => {
    const [hovered, setHover] = useState(false)
    let host = "----"
    let path = "----"
    try {
      let envVars = new Map<string, string>()
      envVars.set("baseUrl", `https://${endpointHost}`)
      const urlStr = processTemplate(request.url, envVars)
      const url = new URL(urlStr)
      host = url.host
      path = decodeURI(url.pathname)
    } catch (e) {}
    const hasResult = !!request.result
    let successIndicator = null
    if (hasResult) {
      const success =
        !request.result.error &&
        request.result.testResults.every(e => e.success)
      successIndicator = success ? <BiCheckCircle /> : <GiCancel />
      successIndicator = (
        <Box color={success ? "green.500" : "red.500"}>{successIndicator}</Box>
      )
    }
    if (fetching) {
      successIndicator = <Spinner size="sm" color="blue" />
    }
    return (
      <HStack
        onClick={() => updateSelectedRequest(idx)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        w="full"
        justifyContent="space-between"
        cursor="pointer"
        bg={selectedRequest == idx ? "gray.100" : "unset"}
        _hover={{ bg: selectedRequest == idx ? "gray.100" : "gray.50" }}
        px="2"
        py="4"
      >
        <HStack>
          {successIndicator}
          <VStack alignItems="flex-start" spacing="1" overflow="hidden">
            <HStack spacing="0" w="full">
              <Text
                fontSize="xs"
                fontWeight="semibold"
                fontFamily="mono"
                w="10"
                color={METHOD_TO_COLOR[request.method] || "gray"}
              >
                {request.method.toUpperCase()}
              </Text>
              <Text
                fontSize="xs"
                fontWeight="medium"
                fontFamily="mono"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
              >
                {path}
              </Text>
            </HStack>
            <Text
              fontSize="xs"
              fontWeight="medium"
              fontFamily="mono"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
              color="gray.500"
            >
              {host}
            </Text>
          </VStack>
        </HStack>
        <Button
          hidden={!hovered}
          size="sm"
          variant="ghost"
          onClick={e => {
            e.stopPropagation()
            deleteRequest(idx)
          }}
          color="red.200"
          _hover={{ color: "red.500" }}
          p="1"
        >
          <IoMdTrash color="inherit" />
        </Button>
      </HStack>
    )
  },
)

const RequestList: React.FC<RequestListProps> = React.memo(
  ({
    endpointHost,
    fetching,
    requests,
    selectedRequest,
    updateSelectedRequest,
    addNewRequest,
    deleteRequest,
    ...props
  }) => {
    return (
      <VStack {...props} overflow="hidden">
        <VStack w="full" alignItems="flex-start" spacing="0">
          {requests.map((e, i) => (
            <RequestItem
              key={i}
              endpointHost={endpointHost}
              fetching={fetching[i]}
              request={e}
              selectedRequest={selectedRequest}
              idx={i}
              updateSelectedRequest={updateSelectedRequest}
              deleteRequest={deleteRequest}
            />
          ))}
        </VStack>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={addNewRequest}
        >
          Request
        </Button>
      </VStack>
    )
  },
)

export default RequestList
