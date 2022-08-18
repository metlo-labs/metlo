import React from "react";
import { Box, VStack } from "@chakra-ui/react";
import List from "./List";
import { Test, TestDetailed } from "@common/testing/types";

const ListTests: React.FC<{ tests: Array<TestDetailed> }> = React.memo(
  ({ tests }) => (
    <VStack
      w="full"
      alignItems="flex-start"
      borderWidth="1px"
      rounded="md"
      spacing="0"
      overflow="hidden"
    >
      <Box w="full">
        <List tests={tests} />
      </Box>
    </VStack>
  )
);

export default ListTests;
