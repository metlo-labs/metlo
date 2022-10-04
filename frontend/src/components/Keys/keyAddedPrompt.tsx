import { PhoneIcon } from "@chakra-ui/icons"
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Button,
  ModalFooter,
  Input,
  HStack,
  VStack,
  Box,
  IconButton,
} from "@chakra-ui/react"

import { IoMdCopy } from "@react-icons/all-files/io/IoMdCopy"

interface KeyAddedInterface {
  newKey: string
  newKeyName: string
  isOpen: boolean
  onClose: () => void
}

const KeyAddedModal: React.FC<KeyAddedInterface> = ({
  newKey,
  newKeyName,
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"xl"}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>New API Key Info</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack>
            <Box>{newKeyName}</Box>
            <HStack w={"full"}>
              <Input type="text" disabled={true} value={newKey} />
              <IconButton
                aria-label={"Copy API Key"}
                icon={<IoMdCopy />}
                onClick={() => navigator.clipboard.writeText(newKey)}
              />
            </HStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack>
            <Button colorScheme="red" onClick={onClose}>
              Close
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
export default KeyAddedModal
