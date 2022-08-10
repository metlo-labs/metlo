import React from "react";

import { Box, Heading, BoxProps } from "@chakra-ui/react";

const EmptyView: React.FC<BoxProps & { text?: string, notRounded?: boolean }> = React.memo(
  ({ notRounded, ...props }) => {
    return (
      <Box
        w="full"
        display="flex"
        justifyContent="center"
        alignItems="center"
        bg="secondaryBG"
        rounded={notRounded ? "none" : "md"}
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
