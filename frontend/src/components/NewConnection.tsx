import {
  useDisclosure,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  SkeletonText,
  Flex,
  IconButton,
  Image,
  useColorMode,
  Square,
  Box,
} from "@chakra-ui/react"
import NextLink from "next/link"
import { ConnectionType } from "@common/enums"

const NewConnection = ({ isOpen, onClose }) => {
  const colorMode = useColorMode()
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Connection Type Selection</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex w={"full"} h={"full"} justifyContent={"space-evenly"}>
            <NextLink href={"/connections/new/aws"}>
              <Button aria-label={"Connect via AWS"} h={"full"} p={"4"}>
                <Image
                  alt={`AWS-image`}
                  boxSize={"125px"}
                  src={`connections/${ConnectionType.AWS}_${colorMode.colorMode}.svg`}
                />
              </Button>
            </NextLink>
            <NextLink href={"/connections/new/gcp"}>
              <Button aria-label={"Connect via GCP"} h={"full"} p={"4"}>
                <Image
                  alt={`GCP-image`}
                  boxSize={"125px"}
                  src={`connections/${ConnectionType.GCP}_${colorMode.colorMode}.svg`}
                />
              </Button>
            </NextLink>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default NewConnection
