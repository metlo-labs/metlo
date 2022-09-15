import { Box, Heading, VStack, Button } from "@chakra-ui/react"
import { FiPlus } from "@react-icons/all-files/fi/FiPlus"
import { Logo } from "components/Logo"
import { DataHeading } from "components/utils/Card"

export const HomeEmptyView: React.FC<{}> = () => {
  return (
    <Box
      bg="secondaryBG"
      w="full"
      h="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing="4">
        <Logo imageHeight="72" imageWidth="254" />
        <Heading size="2xl" pt="4" fontWeight="semibold">
          Welcome to Metlo
        </Heading>
        <DataHeading fontSize="lg" pb="4">
          Add a connection to get started
        </DataHeading>
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
