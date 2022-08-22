import React from "react";
import { Box, StackProps, VStack } from "@chakra-ui/react";
import List from "./List";
import { TestDetailed } from "@common/testing/types";

interface ListTestsProps extends StackProps {
  tests: TestDetailed[];
}

const ListTests: React.FC<ListTestsProps> = React.memo(
  ({ tests, ...props }) => (
    <VStack
      w="full"
      alignItems="flex-start"
      borderWidth="1px"
      rounded="md"
      spacing="0"
      overflow="hidden"
      {...props}
    >
      <Box w="full">
        <List tests={tests} />
      </Box>
    </VStack>
  )
);

export default ListTests;
