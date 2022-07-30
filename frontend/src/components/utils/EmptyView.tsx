import React from "react";

import { Box, Heading, BoxProps } from "@chakra-ui/react";

const EmptyView: React.FC<BoxProps> = React.memo((props) => {
  return (
    <Box
      w="full"
      display="flex"
      justifyContent="center"
      alignItems="center"
      border="4px"
      borderStyle="dashed"
      borderColor="gray.400"
      rounded="md"
      minH="md"
      {...props}
    >
      <Heading size="lg" textAlign="center" color="gray.400">
        Nothing here yet!
      </Heading>
    </Box>
  );
});

export default EmptyView;