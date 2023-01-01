import React, { useState } from "react"
import {
  InputGroup,
  InputLeftElement,
  Input,
  Stack,
  Button,
  useToast,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react"
import { BsSearch } from "icons/bs/BsSearch"
import debounce from "lodash/debounce"
import { GetHostParams } from "@common/api/endpoint"
import { deleteHost } from "api/endpoints"
import { makeToast } from "utils"

interface HostFilterProps {
  params: GetHostParams
  setParams: (t: (e: GetHostParams) => GetHostParams) => void
  selectedHost: string
  setSelectedHost: React.Dispatch<React.SetStateAction<string>>
}

const HostFilters: React.FC<HostFilterProps> = React.memo(
  ({ params, setParams, selectedHost, setSelectedHost }) => {
    const setSearchQuery = (val: string) => {
      setParams(oldParams => ({
        ...oldParams,
        searchQuery: val,
        offset: 0,
      }))
    }
    const debounceSearch = debounce(setSearchQuery, 500)
    const [deleting, setDeleting] = useState<boolean>(false)
    const toast = useToast()
    const { isOpen, onOpen, onClose } = useDisclosure()
    const cancelRef = React.useRef()

    const handleDeleteHostClick = async () => {
      try {
        setDeleting(true)
        onClose()
        await deleteHost(selectedHost)
        toast(
          makeToast(
            {
              title: `Deleted host ${selectedHost}`,
              status: "success"
            }
          )
        )
        setSelectedHost(null)
        setParams(oldParams => ({
          ...oldParams,
          offset: 0,
        }))
      } catch (err) {
        toast(
          makeToast(
            {
              title: "Deleting host failed...",
              status: "error",
              description: err.response?.data
            },
            err.response?.status
          )
        )
      } finally {
        setDeleting(false)
      }
    }

    return (
      <Stack
        direction={{ base: "column", md: "row" }}
        w="full"
        justifyContent="space-between"
      >
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <BsSearch />
          </InputLeftElement>
          <Input
            spellCheck={false}
            onChange={e => debounceSearch(e.target.value)}
            w={{ base: "full", lg: "xs" }}
            type="text"
            placeholder="Search for host..."
            bg="white"
          />
        </InputGroup>
        <Button colorScheme="red" isDisabled={selectedHost === null} isLoading={deleting} onClick={onOpen}>
          Delete
        </Button>
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Host
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete host <strong>{selectedHost}</strong> ?
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Cancel
                </Button>
                <Button isLoading={deleting} colorScheme="red" onClick={handleDeleteHostClick} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Stack>
    )
  },
)

export default HostFilters
