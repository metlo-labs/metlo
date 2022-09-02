import React, { useState } from "react"
import {
  Heading,
  HStack,
  StackDivider,
  StackProps,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  useColorModeValue,
} from "@chakra-ui/react"
import { EndpointAndUsage } from "@common/types"
import TraceList from "components/Endpoint/TraceList"

interface TopEndpointProps extends StackProps {
  endpoints: EndpointAndUsage[]
}

interface EndpointListProps {
  selectedEndpoint: string
  setSelectedEndpoint: (e: string) => void
  endpoints: EndpointAndUsage[]
}

const EndpointList: React.FC<EndpointListProps> = React.memo(
  ({ endpoints, selectedEndpoint, setSelectedEndpoint }) => {
    const selectedRowColor = useColorModeValue(
      "rgb(242, 242, 242)",
      "rgb(34, 37, 42)",
    )
    return (
      <TableContainer w="full" bg="cellBG">
        <Table variant="simple" w="full">
          <Thead h="52px">
            <Tr>
              <Th>Endpoint</Th>
              <Th>Calls/Min</Th>
            </Tr>
          </Thead>
          <Tbody>
            {endpoints.map(e => (
              <Tr
                onClick={() => setSelectedEndpoint(e.uuid)}
                key={e.uuid}
                bg={selectedEndpoint == e.uuid ? selectedRowColor : "unset"}
                cursor="pointer"
              >
                <Td fontFamily="mono" fontSize="xs">
                  {e.path}
                </Td>
                <Td fontSize="xs">{e.last1MinCnt}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    )
  },
)

const TopEndpoints: React.FC<TopEndpointProps> = React.memo(
  ({ endpoints, ...props }) => {
    const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(
      endpoints.length > 0 ? endpoints[0].uuid : null,
    )
    const endpoint = endpoints.find(e => e.uuid == selectedEndpoint)
    return (
      <VStack
        borderWidth="1px"
        rounded="md"
        overflow="hidden"
        alignItems="flex-start"
        spacing="0"
        bg="cellBG"
        divider={<StackDivider />}
        {...props}
      >
        <Heading px="4" py="2" size="md" color="gray.800">
          Top Endpoints
        </Heading>
        <HStack
          w="full"
          spacing="0"
          flexGrow="1"
          divider={<StackDivider />}
          alignItems="flex-start"
        >
          <Box w="sm" h="full">
            <EndpointList
              endpoints={endpoints}
              setSelectedEndpoint={setSelectedEndpoint}
              selectedEndpoint={selectedEndpoint}
            />
          </Box>
          <Box flexGrow="1" h="full" overflow="scroll">
            <TraceList traces={endpoint ? endpoint.traces : []} />
          </Box>
        </HStack>
      </VStack>
    )
  },
)

export default TopEndpoints
