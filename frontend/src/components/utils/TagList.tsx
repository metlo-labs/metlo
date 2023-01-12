import React, { useState } from "react"
import { Select } from "chakra-react-select"
import { HStack, Tag, Button, Box } from "@chakra-ui/react"
import { FiPlus } from "icons/fi/FiPlus"
import { HiPencil } from "icons/hi/HiPencil"

interface TagListProps {
  allTags: string[]
  tags: string[]
  updateTags: (e: string[]) => void
}

export const TagList: React.FC<TagListProps> = React.memo(
  ({ allTags, tags, updateTags }) => {
    const [editing, setEditing] = useState(false)
    if (editing) {
      return (
        <HStack>
          <Box w="lg">
            <Select
              className="chakra-react-select"
              value={tags.map(e => ({
                label: e,
                value: e,
              }))}
              isMulti={true}
              size="sm"
              options={allTags.map(e => ({
                label: e,
                value: e,
              }))}
              placeholder="Select tags..."
              instanceId="endpoint-test-edit-tag-selector"
              onChange={e => updateTags(e.map(t => t.label))}
            />
          </Box>
          <Button
            variant="create"
            rounded="sm"
            size="sm"
            onClick={() => setEditing(false)}
          >
            Save
          </Button>
        </HStack>
      )
    }
    return (
      <HStack>
        {tags.map((e, i) => (
          <Tag key={i}>{e}</Tag>
        ))}
        <Button
          variant="link"
          leftIcon={tags.length > 0 ? <HiPencil /> : <FiPlus />}
          onClick={() => setEditing(true)}
          color="gray.500"
        >
          {tags.length > 0 ? "Edit" : "Add Tags"}
        </Button>
      </HStack>
    )
  },
)
