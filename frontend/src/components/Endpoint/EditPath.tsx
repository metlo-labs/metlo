import React, { useEffect, useState } from "react"
import {
  Box,
  Button,
  Text,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  VStack,
  HStack,
  Code,
  Divider,
  Input,
  useToast,
} from "@chakra-ui/react"
import { useRouter } from "next/router"
import { HiPlus } from "icons/hi/HiPlus"
import { makeToast } from "utils"
import { ImCheckmark } from "icons/im/ImCheckmark"
import { getSuggestedPaths, updatePaths } from "api/endpoints"

interface EditPathProps {
  endpointId: string
  endpointPath: string
}

export const EditPath: React.FC<EditPathProps> = React.memo(
  ({ endpointId, endpointPath }) => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [newEndpoints, setNewEndpoints] = useState<string[]>([])
    const [suggestedPaths, setSuggestedPaths] = useState<string[]>([])
    const [updating, setUpdating] = useState<boolean>(false)
    const toast = useToast()
    const router = useRouter()

    const addPath = () => {
      setNewEndpoints(old => ["", ...old])
    }

    const addPathHandler = (path: string) => {
      if (newEndpoints.includes(path)) {
        toast(
          makeToast({
            title: "Path already exists in New Endpoints list",
            status: "error",
            duration: 5,
          }),
        )
      } else {
        setNewEndpoints(old => [...old, path])
      }
    }

    const editInputHandler = (index: number, newVal: string) => {
      setNewEndpoints(old => {
        old[index] = newVal.trim()
        return [...old]
      })
    }

    const deletePathHandler = (index: number) => {
      setNewEndpoints(old => old.filter((e, i) => i !== index))
    }

    const closeModal = () => {
      setNewEndpoints([])
      onClose()
    }

    const openModal = () => {
      const fetch = async () => {
        try {
          const resp = await getSuggestedPaths(endpointId)
          setSuggestedPaths(resp)
        } catch {}
      }
      if (suggestedPaths?.length === 0) {
        fetch()
      }
      onOpen()
    }

    const updateHandler = async () => {
      if (newEndpoints.length === 0) {
        toast(
          makeToast({
            title: "Updating Paths Failed...",
            status: "error",
            description: "Must have at least 1 new endpoint defined",
          }),
        )
        return
      }
      if (newEndpoints.includes(endpointPath)) {
        toast(
          makeToast({
            title: "Updating Paths Failed...",
            status: "error",
            description:
              "New Endpoints cannot include the current endpoint path",
          }),
        )
        return
      }
      setUpdating(true)
      try {
        const res = await updatePaths(endpointId, newEndpoints)
        toast(
          makeToast({
            title: "Created New Endpoints",
            status: "success",
            description: "Redirecting to Endpoints Page...",
          }),
        )
        setTimeout(() => router.replace("/endpoints"), 3000)
      } catch (err) {
        toast(
          makeToast({
            title: "Updating Paths Failed...",
            status: "error",
            description: err.response.data,
          }),
        )
      } finally {
        setUpdating(false)
      }
    }

    return (
      <Box>
        <Button colorScheme="blue" onClick={openModal}>
          Edit
        </Button>
        <Modal size="4xl" isCentered isOpen={isOpen} onClose={closeModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Path</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack w="full" spacing={6}>
                <VStack w="full" spacing={2} alignItems="flex-start">
                  <HStack w="full" justifyContent="space-between">
                    <Text>New Endpoints</Text>
                    <Button
                      colorScheme="blue"
                      leftIcon={<HiPlus />}
                      onClick={addPath}
                    >
                      Add
                    </Button>
                  </HStack>
                  <VStack
                    borderWidth="1px"
                    w="full"
                    maxH="300px"
                    overflowY="auto"
                  >
                    {newEndpoints.map((e, i) => (
                      <Box w="full" key={i}>
                        <HStack p={3} w="full" justifyContent="space-between">
                          <>
                            <Input
                              type="text"
                              maxLength={500}
                              spellCheck={false}
                              w="50%"
                              value={e}
                              onChange={val =>
                                editInputHandler(i, val.target.value)
                              }
                            />
                            <Button
                              colorScheme="red"
                              onClick={() => deletePathHandler(i)}
                            >
                              Delete
                            </Button>
                          </>
                        </HStack>
                        <Divider />
                      </Box>
                    ))}
                  </VStack>
                </VStack>
                {suggestedPaths?.length > 0 ? (
                  <VStack w="full" spacing={2} alignItems="flex-start">
                    <Text>Suggested Endpoints</Text>
                    <VStack
                      borderWidth="1px"
                      w="full"
                      maxH="300px"
                      overflowY="auto"
                    >
                      {suggestedPaths.map((e, i) => {
                        return (
                          <Box w="full" key={i}>
                            <HStack
                              p={2}
                              w="full"
                              justifyContent="space-between"
                            >
                              <Code p="1">{e}</Code>
                              {newEndpoints.includes(e) ? (
                                <ImCheckmark color="green" />
                              ) : (
                                <Button
                                  colorScheme="blue"
                                  onClick={() => addPathHandler(e)}
                                >
                                  Add
                                </Button>
                              )}
                            </HStack>
                            <Divider />
                          </Box>
                        )
                      })}
                    </VStack>
                  </VStack>
                ) : null}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={closeModal}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                isLoading={updating}
                onClick={updateHandler}
              >
                Update
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    )
  },
)
