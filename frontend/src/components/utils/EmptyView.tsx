import React from "react";

import { Box, Heading, BoxProps } from "@chakra-ui/react";

const EmptyView: React.FC<BoxProps & { text?: string }> = React.memo(
  (props) => {
    return (
      <Box
        w="full"
        display="flex"
        justifyContent="center"
        alignItems="center"
        bg="secondaryBG"
        rounded="md"
        minH="xs"
        {...props}
      >
        <Heading size="lg" fontWeight="semibold" textAlign="center" color="gray.400">
          {props.text || "Nothing here yet!"}
        </Heading>
      </Box>
    );
  }
);

export default EmptyView;
