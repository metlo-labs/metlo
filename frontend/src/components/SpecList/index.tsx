import React from "react";
import NextLink from "next/link";
import { Box, VStack, HStack, Button } from "@chakra-ui/react";
import { OpenApiSpec } from "@common/types";
import List from "./List";

interface APISpecListProps {
  apiSpecs: OpenApiSpec[];
}

const APISpecList: React.FC<APISpecListProps> = React.memo(({ apiSpecs }) => {
  return (
    <VStack
      w="full"
      alignItems="flex-start"
      borderWidth="1px"
      rounded="md"
      spacing="0"
      overflow="hidden"
    >
      <Box p="4" borderBottom="1px" borderColor="inherit" w="full">
        <HStack justifyContent="space-between">
          <Box />
          <NextLink href="/spec/new">
            <Button colorScheme="blue">New</Button>
          </NextLink>
        </HStack>
      </Box>
      <Box w="full">
        <List apiSpecs={apiSpecs} />
      </Box>
    </VStack>
  );
});

export default APISpecList;
