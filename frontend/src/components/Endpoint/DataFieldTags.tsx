import React, { useEffect, useState } from "react"
import { Select } from "chakra-react-select"
import { DataField } from "@common/types"
import { HStack, Tag, Button, Box, Wrap, WrapItem } from "@chakra-ui/react"
import { FiPlus } from "icons/fi/FiPlus"
import { HiPencil } from "icons/hi/HiPencil"
import { DataClass } from "@common/enums"
import { DATA_CLASS_TO_RISK_SCORE } from "@common/maps"
import { RISK_TO_COLOR } from "~/constants"

interface TagListProps {
  updating: boolean
  tags: DataClass[]
  updateTags: (e: DataClass[]) => Promise<void | DataField>
}

export const DataFieldTagList: React.FC<TagListProps> = React.memo(
  ({ updating, tags, updateTags }) => {
    const [editing, setEditing] = useState(false)
    const [editedTags, setEditedTags] = useState(tags)

    useEffect(() => {
      setEditing(false)
      setEditedTags(tags)
    }, [tags])

    const setEditedTagsWrapper = (ls: DataClass[]) => {
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
        <HStack w="full">
          <Box w="full">
            <Select
              value={editedTags.map(e => ({
                label: e,
                value: e,
              }))}
              isMulti={true}
              size="sm"
              options={Object.values(DataClass).map(e => ({
                label: e,
                value: e,
              }))}
              placeholder="Select tags..."
              instanceId="endpoint-data-field-edit-tag-selector"
              onChange={e => setEditedTagsWrapper(e.map(t => t.label))}
            />
          </Box>
          <Button
            colorScheme="blue"
            rounded="sm"
            size="sm"
            onClick={saveTags}
            isLoading={updating}
          >
            Save
          </Button>
          <Button
            rounded="sm"
            size="sm"
            onClick={() => {
              setEditing(false)
              setEditedTags(tags)
            }}
          >
            Cancel
          </Button>
        </HStack>
      )
    }
    return (
      <HStack h="full">
        <Wrap h="full">
          {editedTags.map((e, i) => (
            <WrapItem key={i}>
              <Tag
                p="2"
                colorScheme={RISK_TO_COLOR[DATA_CLASS_TO_RISK_SCORE[e]]}
              >
                {e}
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
        <Button
          variant="link"
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
