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
  Status,
  useToast,
} from "@chakra-ui/react"
import { ConnectionType } from "@common/enums"
import { ConnectionInfo } from "@common/types"
import axios, { AxiosError, AxiosResponse } from "axios"
import React, { useState } from "react"
import { api_call_retry, makeToast } from "utils"
import AWS_INFO from "./aws"
import GCP_INFO from "./gcp"

interface ConnectionSelectorInterface {
  connection?: ConnectionInfo
  setConnectionUpdated: (udpatedConnection: ConnectionInfo) => void
  isOpen: boolean
  onClose: () => void
  onDelete: (uuid: string) => void
}

const getRetryId = async (id: string, onError: (err) => void) => {
  try {
    let resp = await axios.delete<{ uuid: string }>(
      `/api/v1/delete_connection/${id}`,
    )
    return resp.data.uuid
  } catch (err) {
    onError(err)
  }
}

const DeleteButton: React.FC<{
  conn: ConnectionInfo
  onDelete: (uuid: string) => void
}> = ({ conn, onDelete }) => {
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()
  const create_toast_with_message = (msg: string, statusCode?: number) => {
    console.log(msg)
    toast(makeToast({
      title: `Encountered an error while deleting connection`,
      description: msg,
      status: "error",
      duration: 6000,
    }, statusCode))
  }
  const onBtnClick = async () => {
    await retrier({
      id: conn.uuid,
      onComplete: () => {
        onDelete(conn.uuid)
      },
    })
  }

  const retrier = async ({
    id,
    onComplete,
  }: {
    id: string
    onComplete?: () => void
  }) => {
    setDeleting(true)
    let retry_id = await getRetryId(id, err => {
      console.log(err)
      create_toast_with_message(err.message, err?.response?.status)
    })

    if (retry_id) {
      console.log("Attempting to fetch")
      api_call_retry({
        url: `/api/v1/long_running/${retry_id}`,
        requestParams: {},
        onAPIError: (err: AxiosError<{ success: string; error: string }>) => {
          create_toast_with_message(err.response.data.error, Number(err.code))
          setDeleting(false)
        },
        onError: (err: Error) => {
          create_toast_with_message(err.message)
          setDeleting(false)
        },
        onSuccess: (resp: AxiosResponse<{ success: string }>) => {
          if (resp.data.success == "OK") {
            onComplete()
          } else {
            create_toast_with_message("Failed to delete connection")
          }
          setDeleting(false)
        },
        onFinally: () => {},
        shouldRetry: (resp: AxiosResponse<{ success: string }>) => {
          return resp.data.success === "FETCHING"
        },
      })
    } else {
      create_toast_with_message("Couldn't attempt to fetch")
      console.log("Couldn't attempt to fetch")
    }
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
      return (
        <GCP_INFO
          connection={connection}
          setConnection={setConnectionUpdated}
        />
      )
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
