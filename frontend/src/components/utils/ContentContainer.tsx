import React from "react"
import { Box, useColorModeValue } from "@chakra-ui/react"

interface ContentContainerProps {
  maxContentW?: string
  children?: React.ReactNode
  height?: string
}

export const ContentContainer: React.FC<ContentContainerProps> = React.memo(
  ({ maxContentW, children, height }) => {
    const bg = useColorModeValue("rgb(252, 252, 252)", "black")
    return (
      <Box w="full" bg={bg} h="full">
        <Box mx="auto" maxW={maxContentW || "7xl"} px="8" py="8" h={height}>
          {children}
        </Box>
      </Box>
    )
  },
)
