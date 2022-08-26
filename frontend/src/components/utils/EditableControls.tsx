import { CheckIcon, CloseIcon, EditIcon } from "@chakra-ui/icons"
import {
  useEditableControls,
  ButtonGroup,
  IconButton,
  Flex,
} from "@chakra-ui/react"

const EditableControls = () => {
  const {
    isEditing,
    getSubmitButtonProps,
    getCancelButtonProps,
    getEditButtonProps,
  } = useEditableControls()

  return isEditing ? (
    <ButtonGroup justifyContent="center" size="sm">
      <IconButton
        aria-label="Set connection name"
        icon={<CheckIcon />}
        {...getSubmitButtonProps()}
      />
      <IconButton
        aria-label="Stop editing connection name"
        icon={<CloseIcon />}
        {...getCancelButtonProps()}
      />
    </ButtonGroup>
  ) : (
    <Flex justifyContent="center">
      <IconButton
        aria-label="Edit connection name"
        size="sm"
        icon={<EditIcon />}
        {...getEditButtonProps()}
      />
    </Flex>
  )
}
export { EditableControls }
