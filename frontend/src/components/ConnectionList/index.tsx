import React from "react";
import NextLink from "next/link";
import { Box, VStack, HStack, Button, useDisclosure } from "@chakra-ui/react";
import { Connection } from "@common/types";
import List from "./List";
import BasicUsage from "../NewConnection";

interface ConnectionListProps {
  connections: Connection[];
}

const ConnectionList: React.FC<ConnectionListProps> = React.memo(
  ({ connections }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
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
            <Button colorScheme="blue" onClick={onOpen}>
              New
            </Button>
            <BasicUsage isOpen={isOpen} onClose={onClose} />
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
