import { Box, Badge, HStack, VStack, Heading } from "@chakra-ui/react"

interface ListNumberProps {
  num: number
  title: string
  children?: React.ReactNode
}

export const ListNumber: React.FC<ListNumberProps> = ({
  num,
  title,
  children,
}) => {
  return (
    <HStack w="full" alignItems="start" spacing="4">
      <Badge
        display="flex"
        alignItems="center"
        justifyContent="center"
        minW="25px"
        h="25px"
        borderRadius="50%"
        bg="black"
        color="white"
      >
        {num}
      </Badge>
      <Box flex="1" overflow="hidden">
        <VStack w="full" alignItems="start">
          <Heading minH="25px" pt="3px" size="sm">
            {title}
          </Heading>
          {children}
        </VStack>
      </Box>
    </HStack>
  )
}
