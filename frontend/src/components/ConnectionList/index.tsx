import React from "react"
import {
  Box,
  VStack,
  HStack,
  Button,
  useDisclosure,
  useQuery,
} from "@chakra-ui/react"
import { ConnectionInfo } from "@common/types"
import List from "./List"
import NewConnection from "../NewConnection"
import EmptyView from "../utils/EmptyView"
import { useRouter } from "next/router"

interface ConnectionListProps {
  connections: ConnectionInfo[]
  setConnections: (v: ConnectionInfo[]) => void
}

const ConnectionList: React.FC<ConnectionListProps> = React.memo(
  ({ connections, setConnections }) => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const router = useRouter()

    return (
      <VStack
        w="full"
        alignItems="flex-start"
        borderWidth="1px"
        rounded="md"
        spacing="0"
        overflow="hidden"
      >
        <Box p="4" borderBottom="1px" borderColor="inherit" w="full">
          <HStack justifyContent="space-between">
            <Box />
            <Button colorScheme="blue" onClick={onOpen}>
              New
            </Button>
            <NewConnection isOpen={isOpen} onClose={onClose} />
          </HStack>
        </Box>
        <Box w="full">
          {connections.length > 0 ? (
            <List
              connections={connections}
              selectedConnection={router.query.id as string}
              setConnections={setConnections}
            />
          ) : (
            <EmptyView notRounded text="No Connections Yet!" />
          )}
        </Box>
      </VStack>
    )
  },
)

export default ConnectionList
