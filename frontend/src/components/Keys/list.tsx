import {
  Badge,
  Button,
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  useColorMode,
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import { ApiKey } from "@common/types"
import { deleteKey } from "api/keys"
import EmptyView from "components/utils/EmptyView"
import { getCustomStyles } from "components/utils/TableUtils"
import { DateTime } from "luxon"
import { useRef, useState } from "react"
import DataTable, { TableColumn } from "react-data-table-component"
import { makeToast } from "utils"

interface ListKeysInterface {
  keys: Array<ApiKey>
  setKeys: (keys: Array<ApiKey>) => void
}

const ListKeys: React.FC<ListKeysInterface> = ({ keys, setKeys }) => {
  const colorMode = useColorMode()
  const [isDeleting, setIsDeleting] = useState<Array<string>>([])
  const [deletePromptKeyName, setDeletePromptKeyName] = useState<string>("")
  const { isOpen, onClose, onOpen } = useDisclosure()
  const leastDestructiveRef = useRef()
  const toast = useToast()

  const onDeletePress = async (key_name: string) => {
    setDeletePromptKeyName(key_name)
    onOpen()
  }

  const onDeleteConfirm = async (key_name: string) => {
    let _keys = [...isDeleting]
    _keys.push(key_name)
    setIsDeleting(_keys)
    try {
      onClose()
      await deleteKey(key_name)
      setIsDeleting([...isDeleting].filter(v => v != key_name))
      setKeys(keys.filter(v => v.name != key_name))
    } catch (err) {
      toast(
        makeToast(
          {
            title: "Deleting Key failed",
            status: "error",
            description: err.response?.data,
          },
          err.response?.status,
        ),
      )
    } finally {
      setIsDeleting([...isDeleting].filter(v => v != key_name))
    }
  }

  let columns: Array<TableColumn<ApiKey>> = [
    {
      name: "Name",
      sortable: true,
      selector: (row: ApiKey) => row.name,
      cell: (row: ApiKey) => row.name,
      id: "name",
    },
    {
      name: "Identifier",
      sortable: false,
      selector: (row: ApiKey) => row.identifier,
      cell: (row: ApiKey) => `${row.identifier}...`,
      id: "identifier",
    },
    {
      name: "Created At",
      sortable: false,
      selector: (row: ApiKey) => row.created,
      cell: (row: ApiKey) =>
        DateTime.fromISO(row.created).toFormat("yyyy-MM-dd"),
      id: "created_at",
    },
    {
      name: "Key Used For",
      sortable: false,
      selector: (row: ApiKey) => row.for,
      cell: (row: ApiKey) => <Badge fontFamily={"mono"}>{row.for}</Badge>,
    },
    {
      name: "",
      sortable: false,
      selector: (row: ApiKey) => row.created,
      cell: (row: ApiKey) => (
        <Button
          colorScheme={"red"}
          onClick={() => onDeletePress(row.name)}
          disabled={isDeleting.includes(row.name)}
        >
          Delete
        </Button>
      ),
      id: "Delete",
      grow: 0,
    },
  ]
  if (keys.length == 0) {
    return <EmptyView text="No API Keys found." />
  } else {
    return (
      <>
        <DataTable
          columns={columns}
          data={keys.sort((a, b) => a.name.localeCompare(b.name))}
          customStyles={getCustomStyles(colorMode.colorMode)}
        />
        <AlertDialog
          isOpen={isOpen}
          onClose={onClose}
          leastDestructiveRef={leastDestructiveRef}
        >
          <AlertDialogOverlay />
          <AlertDialogContent>
            <AlertDialogHeader>Confirm Deletion of API Key</AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              Confirm deletion of API Key : 
              <span style={{ fontWeight: "bold", paddingInlineStart: 4   }}>
                {deletePromptKeyName}
              </span>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button mr={3} onClick={onClose} ref={leastDestructiveRef}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                mr={3}
                onClick={() => {
                  onDeleteConfirm(deletePromptKeyName)
                }}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }
}

export default ListKeys
