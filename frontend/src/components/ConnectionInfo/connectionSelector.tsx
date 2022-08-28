import { DeleteIcon } from "@chakra-ui/icons"
import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from "@chakra-ui/react"
import { ConnectionType } from "@common/enums"
import { ConnectionInfo } from "@common/types"
import axios, { AxiosError } from "axios"
import React, { useState } from "react"
import AWS_INFO from "./aws"

interface ConnectionSelectorInterface {
  connection?: ConnectionInfo
  setConnectionUpdated: (udpatedConnection: ConnectionInfo) => void
  isOpen: boolean
  onClose: () => void
  onDelete: (uuid: string) => void
}

const DeleteButton: React.FC<{
  conn: ConnectionInfo
  onDelete: (uuid: string) => void
}> = ({ conn, onDelete }) => {
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()
  const onBtnClick = () => {
    setDeleting(true)
    axios
      .delete(`/api/v1/delete_connection/${conn.uuid}`)
      .then(() => {
        toast({ title: `Deleted connection ${conn.name}` })
        onDelete(conn.uuid)
      })
      .catch((err: AxiosError<Error>) => {
        console.log(err)
        toast({
          title: `Couldn't Delete connection ${conn.name}`,
          description: "See console for additional details",
        })
      })
      .finally(() => {
        setDeleting(false)
      })
  }
  return (
    <Button
      colorScheme="red"
      onClick={onBtnClick}
      disabled={deleting}
      px={2}
      isLoading={deleting}
    >
      <HStack>
        <DeleteIcon />
        <Box display={{ md: "unset", base: "none" }}>Delete</Box>
      </HStack>
    </Button>
  )
}

const ConnectionSelector: React.FC<ConnectionSelectorInterface> = ({
  connection,
  setConnectionUpdated,
  isOpen,
  onClose,
  onDelete,
}) => {
  const InnerPanelSelector = () => {
    if (connection.connectionType === ConnectionType.AWS) {
      return (
        <AWS_INFO
          connection={connection}
          setConnection={setConnectionUpdated}
        />
      )
    } else if (connection.connectionType === ConnectionType.GCP) {
      return <Box>Nothing yet for GCP</Box>
    } else {
      return <Box>Invalid choice {connection.connectionType}</Box>
    }
  }
  if (connection) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent maxW={"50%"}>
          <ModalHeader>Connection Info</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{InnerPanelSelector()}</ModalBody>
          <ModalFooter>
            <DeleteButton conn={connection} onDelete={onDelete} />
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  } else {
    return <></>
  }
}
export default ConnectionSelector
