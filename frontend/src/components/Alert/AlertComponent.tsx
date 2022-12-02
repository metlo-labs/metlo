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
import { RiEyeOffFill } from "icons/ri/RiEyeOffFill"
import { RiEyeFill } from "icons/ri/RiEyeFill"
import { FiCheckCircle } from "icons/fi/FiCheckCircle"
import { AiOutlineFileSearch } from "icons/ai/AiOutlineFileSearch"
import { Alert, UpdateAlertParams } from "@common/types"
import { SpecExtension, Status, UpdateAlertType } from "@common/enums"
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
  providedSpecString?: string
  providedSpecExtension?: SpecExtension
}

export const AlertComponent: React.FC<AlertComponentProps> = ({
  alert,
  handleUpdateAlert,
  updating,
  providedSpecString,
  providedSpecExtension,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [resolutionMessage, setResolutionMessage] = useState<string>(
    alert.resolutionMessage,
  )

  const closeModal = () => {
    setResolutionMessage(alert.resolutionMessage)
    onClose()
  }

  return (
    <Box w="full" id={`alert-${alert.uuid}`}>
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
      <Modal
        size={{ base: "full", md: "initial" }}
        isCentered
        isOpen={isOpen}
        onClose={closeModal}
      >
        <ModalOverlay />
        <ModalContent w={{ md: "90%", lg: "70%" }} h="85%">
          <ModalHeader mr="30px">
            <HStack w="full" justifyContent="space-between">
              <HStack>
                <Heading size="lg">{alert.type}</Heading>
                {alert.status === Status.IGNORED && <RiEyeOffFill />}
                {alert.status === Status.RESOLVED && (
                  <FiCheckCircle fontSize="20px" color="green" />
                )}
              </HStack>
              <Badge
                fontSize="lg"
                px="2"
                py="1"
                colorScheme={RISK_TO_COLOR[alert.riskScore]}
              >
                {alert.riskScore}
              </Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton mt="10px" />
          <ModalBody
            h="full"
            py="4"
            bg="secondaryBG"
            borderTopWidth={2}
            borderBottomWidth={2}
            overflow="auto"
          >
            {alert && (
              <AlertDetail
                alert={alert}
                resolutionMessage={resolutionMessage}
                setResolutionMessage={setResolutionMessage}
                providedSpecString={providedSpecString}
                providedSpecExtension={providedSpecExtension}
              />
            )}
          </ModalBody>
          {alert.status !== Status.IGNORED && (
            <ModalFooter>
              {alert.status !== Status.RESOLVED && (
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
              )}
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </Box>
  )
}
