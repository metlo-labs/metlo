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
  Box,
} from "@chakra-ui/react"
import { ConnectionType } from "@common/enums"
import { ReactElement } from "react"
interface RenderDocsModalInterface {
  isOpen: boolean
  onClose: () => void
  type: string
  renderComponent: () => ReactElement
}

const RenderDocModal: React.FC<RenderDocsModalInterface> = ({
  isOpen,
  onClose,
  type,
  renderComponent: Component,
}) => {
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size={"4xl"}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Connection Info : {type}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box>
              <Component />
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default RenderDocModal
