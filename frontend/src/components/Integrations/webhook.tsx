import React, { useState } from "react"
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react"
import { HiPlus } from "icons/hi/HiPlus"
import { WebhookResp } from "@common/types"
import { getDateTimeRelative, makeToast } from "utils"
import EmptyView from "components/utils/EmptyView"
import { createWebhook, deleteWebhook } from "api/webhook"

interface WebhookProps {
  webhooks: WebhookResp[]
  setWebhooks: React.Dispatch<React.SetStateAction<WebhookResp[]>>
}

export const Webhook: React.FC<WebhookProps> = React.memo(
  ({ webhooks, setWebhooks }) => {
    const [creatingWebhook, setCreatingWebhook] = useState(false)
    const [deletingWebhook, setDeletingWebhook] = useState(false)
    const [url, setUrl] = useState("")
    const toast = useToast()
    const { isOpen, onOpen, onClose } = useDisclosure()
    const {
      isOpen: isDialogOpen,
      onOpen: onOpenDialog,
      onClose: onCloseDialog,
    } = useDisclosure()
    const [deleteWebhookId, setDeleteWebhookId] = useState(null)
    const cancelRef = React.useRef()

    const createNewWebhookHandler = async () => {
      setCreatingWebhook(true)
      try {
        const resp = await createWebhook({ url, alertTypes: [] })
        setWebhooks(resp)
        closeModal()
      } catch (err) {
        toast(
          makeToast({
            title: "Creating Webhook failed",
            status: "error",
            description: err?.response?.data,
          }),
        )
      } finally {
        setCreatingWebhook(false)
      }
    }

    const deleteWebhookHandler = async () => {
      setDeletingWebhook(true)
      try {
        if (!deleteWebhookId) {
          throw new Error("No webhook id specified for deleting.")
        }
        const resp = await deleteWebhook(deleteWebhookId)
        setWebhooks(resp)
        closeDialog()
      } catch (err) {
        toast(
          makeToast({
            title: "Deleting Webhook failed",
            status: "error",
            description: err?.response?.data,
          }),
        )
      } finally {
        setDeletingWebhook(false)
      }
    }

    const closeModal = () => {
      setUrl("")
      onClose()
    }

    const openDialog = (webhookId: string) => {
      setDeleteWebhookId(webhookId)
      onOpenDialog()
    }

    const closeDialog = () => {
      setDeleteWebhookId(null)
      onCloseDialog()
    }

    return (
      <VStack
        bg="white"
        spacing={8}
        rounded="md"
        w="full"
        alignItems="flex-start"
        borderWidth="1px"
        p="30px"
      >
        <VStack w="full" spacing={4} alignItems="flex-start">
          <Heading fontWeight="medium" size="sm">
            Webhooks
          </Heading>
          <Divider />
        </VStack>
        <HStack w="full" justifyContent="space-between">
          <Text>
            You can add webhooks you would like us to send data to whenever an
            alert is triggered.
          </Text>
          <Button leftIcon={<HiPlus />} colorScheme="blue" onClick={onOpen}>
            Add Webhook
          </Button>
        </HStack>
        {webhooks.length > 0 ? (
          webhooks.map(e => (
            <VStack
              spacing={4}
              key={e.uuid}
              rounded="md"
              p="20px"
              borderWidth="1px"
              w="full"
              alignItems="flex-start"
            >
              <HStack w="full" justifyContent="space-between">
                <Text fontWeight="medium">{e.url}</Text>
                <Button
                  colorScheme="red"
                  isLoading={deletingWebhook}
                  onClick={() => openDialog(e.uuid)}
                >
                  Delete
                </Button>
              </HStack>
              <Text>Created {getDateTimeRelative(e.createdAt)}</Text>
            </VStack>
          ))
        ) : (
          <EmptyView text="No webhooks created yet." />
        )}
        <Modal size="2xl" isOpen={isOpen} onClose={closeModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>New Webhook</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl>
                <HStack w="full" justifyContent="space-between">
                  <FormLabel>Url</FormLabel>
                  <Input
                    type="text"
                    spellCheck={false}
                    w="60%"
                    onChange={e => setUrl(e.target.value)}
                    value={url}
                  />
                </HStack>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={closeModal}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={createNewWebhookHandler}
                isLoading={creatingWebhook}
              >
                Create
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <AlertDialog
          isOpen={isDialogOpen}
          onClose={closeDialog}
          leastDestructiveRef={cancelRef}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader>Delete Webhook</AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to delete this webhook?
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button mr={3} ref={cancelRef} onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  isLoading={deletingWebhook}
                  colorScheme="red"
                  onClick={deleteWebhookHandler}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    )
  },
)
