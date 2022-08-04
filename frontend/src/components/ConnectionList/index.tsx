import React from "react";
import NextLink from "next/link";
import { Box, VStack, HStack, Button } from "@chakra-ui/react";
import { Connection } from "@common/types";
import List from "./List";

interface ConnectionListProps {
  connections: Connection[];
}

const ConnectionList: React.FC<ConnectionListProps> = React.memo(
  ({ connections }) => {
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
            <NextLink href="/connection/new">
              <Button colorScheme="blue">New</Button>
            </NextLink>
          </HStack>
        </Box>
        <Box w="full">
          <List connections={connections} />
        </Box>
      </VStack>
    );
  }
);

export default ConnectionList;
