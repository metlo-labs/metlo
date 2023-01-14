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

enum Action {
  CLEAR_SENSITIVE_DATA,
  CLEAR_DATAFIELDS,
}

const BulkActions: React.FC = React.memo(() => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const [action, setAction] = useState<Action>(Action.CLEAR_DATAFIELDS)
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

  const startAction = (e: Action) => {
    setAction(e)
    onOpen()
  }

  const getActionTitle = (e: Action) => {
    if (e == Action.CLEAR_SENSITIVE_DATA) {
      return "Clear All Sensitive Data"
    }
    if (e == Action.CLEAR_DATAFIELDS) {
      return "Clear All Data Fields"
    }
  }

  const getActionDescription = (e: Action) => {
    if (e == Action.CLEAR_SENSITIVE_DATA) {
      return "Are you sure you want to clear all sensitive data? This is not reversible but Metlo will automatically identify any new sensitive data as new traces come in."
    }
    if (e == Action.CLEAR_DATAFIELDS) {
      return "Are you sure you want to clear all data fields? This is not reversible but Metlo will automatically identify any new data fields as new traces come in."
    }
  }

  const performAction = (e: Action) => {
    if (e == Action.CLEAR_SENSITIVE_DATA) {
      clearSensitiveDataBtn()
    }
    if (e == Action.CLEAR_DATAFIELDS) {
      clearDataFieldsBtn()
    }
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
            <Button
              isLoading={clearSensitiveDataLoading}
              onClick={() => startAction(Action.CLEAR_SENSITIVE_DATA)}
              variant="delete"
            >
              {getActionTitle(Action.CLEAR_SENSITIVE_DATA)}
            </Button>
            <Button
              isLoading={clearAllDataFieldsLoading}
              onClick={() => startAction(Action.CLEAR_DATAFIELDS)}
              variant="delete"
            >
              {getActionTitle(Action.CLEAR_DATAFIELDS)}
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
              {getActionTitle(action)}
            </AlertDialogHeader>
            <AlertDialogBody>{getActionDescription(action)}</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                isLoading={clearSensitiveDataLoading}
                variant="delete"
                onClick={() => performAction(action)}
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
