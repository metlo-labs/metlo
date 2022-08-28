import { useState } from "react"
import {
  Badge,
  Box,
  Heading,
  HStack,
  VStack,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react"
import { RiEyeOffFill } from "@react-icons/all-files/ri/RiEyeOffFill"
import { RiEyeFill } from "@react-icons/all-files/ri/RiEyeFill"
import { AiOutlineExclamationCircle } from "@react-icons/all-files/ai/AiOutlineExclamationCircle"
import { FiCheckCircle } from "@react-icons/all-files/fi/FiCheckCircle"
import { AiOutlineFileSearch } from "@react-icons/all-files/ai/AiOutlineFileSearch"
import { Alert, UpdateAlertParams } from "@common/types"
import { Status, UpdateAlertType } from "@common/enums"
import { RISK_TO_COLOR } from "~/constants"
import { AlertPanel } from "./AlertPanel"
import { AlertDetail } from "./AlertDetail"

interface AlertComponentProps {
  alert: Alert
  handleUpdateAlert: (
    alertId: string,
    updateAlertParams: UpdateAlertParams,
  ) => Promise<void>
  updating: boolean
}

export const AlertComponent: React.FC<AlertComponentProps> = ({
  alert,
  handleUpdateAlert,
  updating,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [resolutionMessage, setResolutionMessage] = useState<string>(
    alert.resolutionMessage,
  )

  return (
    <Box w="full">
      <Box
        borderTopRadius={2}
        w="full"
        h={1.5}
        bg={RISK_TO_COLOR[alert.riskScore]}
      />
      <VStack
        rounded="sm"
        borderTopRadius={0}
        borderWidth={2}
        borderTopWidth={0}
        py="4"
        spacing="4"
        w="full"
      >
        <HStack px="4" w="full" justifyContent="space-between">
          <HStack>
            <Heading fontSize="lg">{alert.type}</Heading>
            {alert.status === Status.IGNORED && <RiEyeOffFill />}
            {alert.status === Status.RESOLVED && (
              <FiCheckCircle fontSize="20px" color="green" />
            )}
          </HStack>
          <Badge fontSize="sm" colorScheme={RISK_TO_COLOR[alert.riskScore]}>
            {alert.riskScore}
          </Badge>
        </HStack>
        <AlertPanel alert={alert} />
        <HStack alignSelf="flex-end" px="4">
          {alert.status !== Status.RESOLVED && (
            <Button
              isLoading={updating}
              onClick={() =>
                handleUpdateAlert(alert.uuid, {
                  updateType:
                    alert.status === Status.IGNORED
                      ? UpdateAlertType.UNIGNORE
                      : UpdateAlertType.IGNORE,
                })
              }
              leftIcon={
                alert.status === Status.OPEN ? <RiEyeOffFill /> : <RiEyeFill />
              }
              border="1px"
            >
              {alert.status === Status.IGNORED ? "Unignore" : "Ignore"}
            </Button>
          )}
          <Button
            leftIcon={<AiOutlineFileSearch size="20px" />}
            colorScheme="green"
            onClick={onOpen}
          >
            View Detail
          </Button>
        </HStack>
      </VStack>
      <Modal size="6xl" isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{alert.type}</ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="700px" overflowY="auto">
            {alert && (
              <AlertDetail
                alert={alert}
                resolutionMessage={resolutionMessage}
                setResolutionMessage={setResolutionMessage}
              />
            )}
          </ModalBody>
          {alert.status !== Status.IGNORED && (
            <ModalFooter>
              {alert.status !== Status.RESOLVED ? (
                <Button
                  isLoading={updating}
                  leftIcon={<FiCheckCircle />}
                  colorScheme="green"
                  onClick={() =>
                    handleUpdateAlert(alert.uuid, {
                      updateType: UpdateAlertType.RESOLVE,
                      resolutionMessage,
                    })
                  }
                >
                  Resolve
                </Button>
              ) : (
                <Button
                  isLoading={updating}
                  leftIcon={<AiOutlineExclamationCircle fontSize="20px" />}
                  colorScheme="red"
                  onClick={() =>
                    handleUpdateAlert(alert.uuid, {
                      updateType: UpdateAlertType.UNRESOLVE,
                    })
                  }
                >
                  Unresolve
                </Button>
              )}
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </Box>
  )
}
