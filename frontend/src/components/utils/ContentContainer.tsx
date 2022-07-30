import React from "react";
import { Box, useColorModeValue } from "@chakra-ui/react";

interface ContentContainerProps {
  maxContentW?: string;
  children?: React.ReactNode;
}

export const ContentContainer: React.FC<ContentContainerProps> = React.memo(
  ({ maxContentW, children }) => {
    const bg = useColorModeValue("rgb(252, 252, 252)", "black");
    return (
      <Box w="full" bg={bg} h="full">
        <Box mx="auto" maxW={maxContentW || "7xl"} px="8" pt="8">
          {children}
        </Box>
      </Box>
    );
  }
);
