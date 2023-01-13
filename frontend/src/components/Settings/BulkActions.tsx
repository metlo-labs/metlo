import React, { useRef, useState } from "react"
import {
  Button,
  VStack,
  Heading,
  Divider,
  HStack,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useToast,
} from "@chakra-ui/react"
import { SectionHeader } from "components/utils/Card"
import { clearAllDataFields, clearSensitiveData } from "api/dataFields"
import { makeToast } from "utils"
import { formatMetloAPIErr, MetloAPIErr } from "api/utils"

const BulkActions: React.FC = React.memo(() => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const [clearSensitiveDataLoading, setSensitiveDataLoading] = useState(false)
  const [clearAllDataFieldsLoading, setClearAllDataFieldsLoading] =
    useState(false)
  const cancelRef = useRef()

  const clearSensitiveDataBtn = () => {
    setSensitiveDataLoading(true)
    clearSensitiveData()
      .then(() => {
        toast(
          makeToast({
            title: "Cleared All Sensitive Data.",
            status: "success",
          }),
        )
      })
      .catch(err => {
        toast(
          makeToast({
            title: "Failed Clearing Sensitive Data...",
            status: "error",
            description: formatMetloAPIErr(err.response.data as MetloAPIErr),
          }),
        )
      })
      .finally(() => {
        setSensitiveDataLoading(false)
        onClose()
      })
  }

  const clearDataFieldsBtn = () => {
    setClearAllDataFieldsLoading(true)
    clearAllDataFields()
      .then(() => {
        toast(
          makeToast({
            title: "Cleared All Data Fields.",
            status: "success",
          }),
        )
      })
      .catch(err => {
        toast(
          makeToast({
            title: "Failed Clearing Data Fields...",
            status: "error",
            description: formatMetloAPIErr(err.response.data as MetloAPIErr),
          }),
        )
      })
      .finally(() => {
        setClearAllDataFieldsLoading(false)
        onClose()
      })
  }

  return (
    <VStack
      bg="white"
      spacing="8"
      rounded="md"
      w="full"
      alignItems="flex-start"
      borderWidth="1px"
      p="30px"
    >
      <VStack w="full" spacing="1" alignItems="flex-start">
        <Heading fontWeight="bold" fontSize="26">
          Bulk Actions
        </Heading>
        <Divider pt="3" />
        <VStack w="full" alignItems="flex-start" pt="5">
          <SectionHeader text="Datafields" />
          <HStack pt="1">
            <Button onClick={onOpen} variant="delete">
              Clear All Sensitive Data
            </Button>
            <Button
              isLoading={clearAllDataFieldsLoading}
              onClick={() => clearDataFieldsBtn()}
              variant="delete"
            >
              Clear All Data Fields
            </Button>
          </HStack>
        </VStack>
      </VStack>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Clear All Sensitive Data
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to clear all sensitive data? This is not
              reversible but Metlo will automatically identify any new sensitive
              data as new traces come in.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                isLoading={clearSensitiveDataLoading}
                variant="delete"
                onClick={clearSensitiveDataBtn}
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  )
})

export default BulkActions
