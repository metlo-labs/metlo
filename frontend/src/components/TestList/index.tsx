import React, { useState } from "react"
import { StackProps, VStack } from "@chakra-ui/react"
import List from "./List"
import { TestDetailed } from "@common/testing/types"
import TestFilters from "./Filters"

interface ListTestsProps extends StackProps {
  endpointUUID: string
  tests: TestDetailed[]
}

const ListTests: React.FC<ListTestsProps> = React.memo(
  ({ endpointUUID, tests, ...props }) => {
    const [tags, setTags] = useState<string[]>([])
    const allTags = Array.from(new Set(tests.map(e => e.tags).flat()))
    let filteredTests = tests
    if (tags.length > 0) {
      filteredTests = filteredTests.filter(test =>
        test.tags.some(e => tags.includes(e)),
      )
    }
    return (
      <VStack
        w="full"
        alignItems="flex-start"
        borderWidth="1px"
        rounded="md"
        spacing="0"
        {...props}
      >
        <TestFilters
          endpointUUID={endpointUUID}
          allTags={allTags}
          tags={tags}
          setTags={setTags}
          px="4"
          pt="4"
        />
        <List tests={filteredTests} />
      </VStack>
    )
  },
)

export default ListTests
