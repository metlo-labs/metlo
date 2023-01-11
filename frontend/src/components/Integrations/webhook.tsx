import React, { useState } from "react"
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
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
  Wrap,
} from "@chakra-ui/react"
import { Select } from "chakra-react-select"
import { HiPlus } from "icons/hi/HiPlus"
import { WebhookResp } from "@common/types"
import { getDateTimeRelative, makeToast } from "utils"
import EmptyView from "components/utils/EmptyView"
import { createWebhook, deleteWebhook, updateWebhook } from "api/webhook"
import { AlertType } from "@common/enums"
import { DataHeading } from "components/utils/Card"
import { formatMetloAPIErr, MetloAPIErr } from "api/utils"

interface WebhookProps {
  webhooks: WebhookResp[]
  setWebhooks: React.Dispatch<React.SetStateAction<WebhookResp[]>>
  hostList: string[]
}

interface CreateState {
  url: string
  alertTypes: AlertType[]
  hosts: string[]
}

interface UpdateState {
  uuid: string
  url: string
  alertTypes: AlertType[]
  hosts: string[]
}

const initialCreateState: CreateState = {
  url: "",
  alertTypes: [],
  hosts: [],
}

export const Webhook: React.FC<WebhookProps> = React.memo(
  ({ webhooks, setWebhooks, hostList }) => {
    const [creatingWebhook, setCreatingWebhook] = useState(false)
    const [deletingWebhook, setDeletingWebhook] = useState(false)
    const [updatingWebhook, setUpdatingWebhook] = useState(false)
    const [createState, setCreateState] =
      useState<CreateState>(initialCreateState)
    const [editState, setEditState] = useState<UpdateState>(null)
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
        const resp = await createWebhook(createState)
        setWebhooks(resp)
        closeModal()
      } catch (err) {
        toast(
          makeToast({
            title: "Creating Webhook failed",
            status: "error",
            description: formatMetloAPIErr(err.response.data as MetloAPIErr),
          }),
        )
      } finally {
        setCreatingWebhook(false)
      }
    }

    const updateWebhookHandler = async () => {
      setUpdatingWebhook(true)
      try {
        const { uuid } = editState
        const resp = await updateWebhook(editState, uuid)
        setWebhooks(resp)
        closeModal()
      } catch (err) {
        toast(
          makeToast({
            title: "Updating Webhook failed",
            status: "error",
            description: formatMetloAPIErr(err.response.data as MetloAPIErr),
          }),
        )
      } finally {
        setUpdatingWebhook(false)
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

    const openModal = (webhook?: WebhookResp) => {
      if (webhook) {
        setEditState({
          uuid: webhook.uuid,
          url: webhook.url,
          alertTypes: webhook.alertTypes,
          hosts: webhook.hosts,
        })
      }
      onOpen()
    }

    const closeModal = () => {
      setCreateState(initialCreateState)
      setEditState(null)
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
        <VStack w="full" spacing={1} alignItems="flex-start">
          <HStack w="full" justifyContent="space-between">
            <Heading fontWeight="bold" fontSize={26}>
              Webhooks
            </Heading>
            <Button
              leftIcon={<HiPlus />}
              colorScheme="blue"
              onClick={() => openModal()}
            >
              Add
            </Button>
          </HStack>
          <Text fontSize="sm">
            You can add webhooks you would like us to send data to whenever an
            alert is triggered.
          </Text>
          <Divider pt={3} />
        </VStack>
        {webhooks.length > 0 ? (
          webhooks.map(e => (
            <VStack
              spacing={3}
              key={e.uuid}
              rounded="md"
              p="20px"
              borderWidth="1px"
              w="full"
              alignItems="flex-start"
              position="relative"
              minH="150px"
            >
              <Text
                wordBreak="break-all"
                fontFamily="mono"
                fontWeight="bold"
                fontSize="md"
                maxW="calc(100% - 155px)"
              >
                {e.url}
              </Text>
              <HStack position="absolute" top="0" right="20px" spacing={2}>
                <Button
                  size="md"
                  borderWidth="1px"
                  onClick={() => openModal(e)}
                >
                  Edit
                </Button>
                <Button
                  size="md"
                  variant="delete"
                  isLoading={deletingWebhook}
                  onClick={() => openDialog(e.uuid)}
                >
                  Delete
                </Button>
              </HStack>
              <VStack spacing={3} w="full" pb={8}>
                {e?.hosts?.length > 0 ? (
                  <VStack w="full" alignItems="flex-start" spacing={1}>
                    <DataHeading>Hosts</DataHeading>
                    <Wrap spacing={2}>
                      {e.hosts.map(host => (
                        <Badge
                          borderWidth="1px"
                          key={host}
                          textTransform="none"
                          rounded="sm"
                          colorScheme="gray"
                        >
                          {host}
                        </Badge>
                      ))}
                    </Wrap>
                  </VStack>
                ) : null}
                {e?.alertTypes?.length > 0 ? (
                  <VStack alignItems="flex-start" w="full" spacing={1}>
                    <DataHeading>Alert Types</DataHeading>
                    <Wrap spacing={2}>
                      {e.alertTypes.map(type => (
                        <Badge
                          borderWidth="1px"
                          key={type}
                          textTransform="none"
                          rounded="sm"
                          colorScheme="gray"
                        >
                          {type}
                        </Badge>
                      ))}
                    </Wrap>
                  </VStack>
                ) : null}
              </VStack>
              <Text position="absolute" bottom="20px" right="20px">
                Added {getDateTimeRelative(e.createdAt)}
              </Text>
            </VStack>
          ))
        ) : (
          <EmptyView text="No webhooks created yet." />
        )}
        <Modal size="2xl" isOpen={isOpen} onClose={closeModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{editState ? "Update" : "New"} Webhook</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack w="full" alignItems="flex-start" spacing={4}>
                <FormControl>
                  <HStack w="full" justifyContent="space-between">
                    <FormLabel>Url</FormLabel>
                    <Input
                      type="text"
                      maxLength={200}
                      spellCheck={false}
                      w="60%"
                      onChange={e =>
                        editState
                          ? setEditState({ ...editState, url: e.target.value })
                          : setCreateState({
                              ...createState,
                              url: e.target.value,
                            })
                      }
                      value={editState ? editState.url : createState.url}
                    />
                  </HStack>
                </FormControl>
                <FormControl>
                  <HStack
                    alignItems="flex-start"
                    w="full"
                    justifyContent="space-between"
                  >
                    <FormLabel>Hosts</FormLabel>
                    <Box w="60%">
                      <Select
                        value={
                          editState
                            ? editState.hosts.map(host => ({
                                label: host,
                                value: host,
                              }))
                            : createState.hosts.map(host => ({
                                label: host,
                                value: host,
                              }))
                        }
                        isMulti={true}
                        size="sm"
                        options={hostList.map(e => ({
                          label: e,
                          value: e,
                        }))}
                        placeholder="Host Filters..."
                        instanceId="host-filter"
                        onChange={e =>
                          editState
                            ? setEditState({
                                ...editState,
                                hosts: e.map(host => host.label),
                              })
                            : setCreateState({
                                ...createState,
                                hosts: e.map(host => host.label),
                              })
                        }
                      />
                    </Box>
                  </HStack>
                </FormControl>
                <FormControl>
                  <HStack
                    alignItems="flex-start"
                    w="full"
                    justifyContent="space-between"
                  >
                    <FormLabel>Alert Types</FormLabel>
                    <Box w="60%">
                      <Select
                        value={
                          editState
                            ? editState.alertTypes.map(type => ({
                                label: type,
                                value: type,
                              }))
                            : createState.alertTypes.map(type => ({
                                label: type,
                                value: type,
                              }))
                        }
                        isMulti={true}
                        size="sm"
                        options={Object.keys(AlertType).map(e => ({
                          label: AlertType[e],
                          value: AlertType[e],
                        }))}
                        placeholder="Alert Type Filters..."
                        instanceId="alert-type-filter"
                        onChange={e =>
                          editState
                            ? setEditState({
                                ...editState,
                                alertTypes: e.map(type => type.label),
                              })
                            : setCreateState({
                                ...createState,
                                alertTypes: e.map(type => type.label),
                              })
                        }
                      />
                    </Box>
                  </HStack>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={closeModal}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={
                  editState ? updateWebhookHandler : createNewWebhookHandler
                }
                isLoading={editState ? updatingWebhook : creatingWebhook}
              >
                {editState ? "Update" : "Create"}
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
                  variant="delete"
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
