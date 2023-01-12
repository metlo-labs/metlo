import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Flex,
  Button,
  ModalFooter,
  Image,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  HStack,
} from "@chakra-ui/react"
import { ConnectionType } from "@common/enums"
import { useState } from "react"

interface NewKeysInterface {
  isOpen: boolean
  onClose: () => void
  onCreate: (key_name: string) => void
  isAddingKey: boolean
}

const NewKeys: React.FC<NewKeysInterface> = ({
  isOpen,
  onClose,
  onCreate,
  isAddingKey,
}) => {
  const [keyName, setKeyName] = useState("")
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add a new API Key</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Key Name</FormLabel>
            <Input type="text" onChange={e => setKeyName(e.target.value)} />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <HStack>
            <Button onClick={onClose} disabled={isAddingKey}>
              Close
            </Button>
            <Button
              variant="create"
              onClick={() => onCreate(keyName)}
              disabled={isAddingKey}
            >
              Create Key
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
export default NewKeys
