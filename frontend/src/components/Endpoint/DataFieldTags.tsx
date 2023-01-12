import React, { useEffect, useState } from "react"
import { Select } from "chakra-react-select"
import { DataClass, DataField } from "@common/types"
import {
  HStack,
  Tag,
  Button,
  Box,
  Wrap,
  WrapItem,
  Stack,
} from "@chakra-ui/react"
import { FiPlus } from "icons/fi/FiPlus"
import { HiPencil } from "icons/hi/HiPencil"
import { RISK_TO_COLOR } from "~/constants"

interface TagListProps {
  updating: boolean
  tags: string[]
  dataClasses: DataClass[]
  updateTags: (e: string[]) => Promise<void | DataField>
}

export const DataFieldTagList: React.FC<TagListProps> = React.memo(
  ({ updating, tags, dataClasses, updateTags }) => {
    const [editing, setEditing] = useState(false)
    const [editedTags, setEditedTags] = useState(tags)

    useEffect(() => {
      setEditing(false)
      setEditedTags(tags)
    }, [tags])

    const setEditedTagsWrapper = (ls: string[]) => {
      if (updating) {
        return
      }
      setEditedTags(ls)
    }

    const saveTags = () => {
      updateTags(editedTags).then(e => {
        if (!e) {
          setEditedTags(tags)
        } else {
          setEditing(false)
        }
      })
    }

    if (editing) {
      return (
        <Stack direction={{ base: "column", md: "row" }} w="full">
          <Box w="full">
            <Select
              className="chakra-react-select"
              value={editedTags.map(e => ({
                label: e,
                value: e,
              }))}
              isMulti={true}
              size="sm"
              options={dataClasses.map(({ className }) => ({
                label: className,
                value: className,
              }))}
              placeholder="Select tags..."
              instanceId="endpoint-data-field-edit-tag-selector"
              onChange={e => setEditedTagsWrapper(e.map(t => t.label))}
            />
          </Box>
          <HStack alignSelf="flex-end">
            <Button
              variant="create"
              rounded="md"
              size="sm"
              onClick={saveTags}
              isLoading={updating}
            >
              Save
            </Button>
            <Button
              rounded="md"
              size="sm"
              onClick={() => {
                setEditing(false)
                setEditedTags(tags)
              }}
            >
              Cancel
            </Button>
          </HStack>
        </Stack>
      )
    }
    return (
      <HStack h="full">
        <Wrap h="full">
          {editedTags.map((e, i) => (
            <WrapItem key={i}>
              <Tag
                p="2"
                colorScheme={
                  RISK_TO_COLOR[
                    dataClasses.find(({ className }) => className == e)
                      ?.severity
                  ]
                }
              >
                {e}
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
        <Button
          variant="link"
          border="0"
          leftIcon={editedTags.length > 0 ? <HiPencil /> : <FiPlus />}
          onClick={() => setEditing(true)}
          color="gray.500"
          h="full"
        >
          {editedTags.length > 0 ? "Edit" : "Add Data Classes"}
        </Button>
      </HStack>
    )
  },
)
