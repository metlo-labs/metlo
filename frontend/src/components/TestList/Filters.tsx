import React from "react"
import NextLink from "next/link"
import { Stack, Box, StackProps, Button } from "@chakra-ui/react"
import { FiPlus } from "icons/fi/FiPlus"
import { Select } from "chakra-react-select"

interface TestFilterProps extends StackProps {
  endpointUUID: string
  allTags: string[]
  setTags: React.Dispatch<React.SetStateAction<string[]>>
  tags: string[]
}

const TestFilters: React.FC<TestFilterProps> = React.memo(
  ({ endpointUUID, allTags, setTags, tags, ...props }) => {
    return (
      <Stack
        direction={{ base: "column", lg: "row" }}
        justifyContent={{ base: "unset", lg: "space-between" }}
        w="full"
        {...props}
      >
        <Box w="xs">
          <Select
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
            placeholder="Filter by tag..."
            instanceId="endpoint-test-tbl-tag-selector"
            onChange={e => setTags(e.map(t => t.label))}
          />
        </Box>
        <NextLink href={`/endpoint/${endpointUUID}/test/new`}>
          <Button leftIcon={<FiPlus />} size="sm" colorScheme="blue">
            New
          </Button>
        </NextLink>
      </Stack>
    )
  },
)

export default TestFilters
