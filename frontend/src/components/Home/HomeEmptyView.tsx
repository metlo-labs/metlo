import { Box, Heading, VStack, Button } from "@chakra-ui/react"
import { FiPlus } from "@react-icons/all-files/fi/FiPlus"
import { Logo } from "components/Logo"
import { DataHeading } from "components/utils/Card"

export const HomeEmptyView: React.FC<{}> = () => {
  return (
    <Box
      bg="secondaryBG"
      w="full"
      h="calc(100vh - 4rem)"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing="4">
        <Logo />
        <Heading size="2xl">Welcome to Metlo</Heading>
        <DataHeading fontSize="lg">Add a connection to get started</DataHeading>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          as="a"
          href="/connections"
        >
          Connection
        </Button>
      </VStack>
    </Box>
  )
}
