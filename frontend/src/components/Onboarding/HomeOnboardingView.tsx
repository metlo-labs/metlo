import { Box, VStack, Button, HStack } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { ConnectionType } from "@common/enums"
import { BiChevronRightCircle } from "icons/bi/BiChevronRightCircle"
import { GetStarted } from "./GetStarted"
import { ConnectionSetup } from "./ConnectionSetup"
import { ListenRequests } from "./ListenRequests"

export const HomeOnboardingView: React.FC<{}> = () => {
  const router = useRouter()
  const { step, type } = router.query

  let body = null

  switch (step) {
    case "1":
      body = <GetStarted />
      break
    case "2":
      body = <ConnectionSetup type={ConnectionType[type as string]} />
      break
    case "3":
      body = <ListenRequests />
      break
    default:
      body = <GetStarted />
  }

  const handleStepClick = (step: number) => {
    router.push({ pathname: "/", query: { step } })
  }

  return (
    <Box minH="100%" display="flex" flexDirection="column" alignItems="center">
      <VStack w="90%" py="20px">
        <HStack w="full" spacing="30px">
          <Button
            onClick={() => handleStepClick(1)}
            variant="unstyled"
            pointerEvents={step === "1" || !step ? "none" : "initial"}
            color={step === "1" || !step ? "blue" : "initial"}
          >
            Get Started
          </Button>
          <BiChevronRightCircle />
          <Button
            onClick={() => handleStepClick(2)}
            variant="unstyled"
            pointerEvents={step === "2" ? "none" : "initial"}
            color={step === "2" ? "blue" : "initial"}
          >
            Set up Connection
          </Button>
          <BiChevronRightCircle />
          <Button
            onClick={() => handleStepClick(3)}
            variant="unstyled"
            pointerEvents={step === "3" ? "none" : "initial"}
            color={step === "3" ? "blue" : "initial"}
          >
            Listen for Requests
          </Button>
        </HStack>
        <VStack
          w="full"
          rounded="md"
          borderWidth="1px"
          alignItems="flex-start"
          p="30px"
          spacing="6"
          bg="var(--chakra-colors-chakra-body-bg)"
        >
          {body}
        </VStack>
      </VStack>
    </Box>
  )
}
