import { Box, VStack, Button, HStack, Wrap, WrapItem } from "@chakra-ui/react"
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
      <VStack w={{ base: "full", md: "90%" }} py="20px">
        <Wrap w="full">
          <WrapItem
            w={{ base: "full", sm: "unset" }}
            pr={{ base: 0, sm: 2, md: 4, lg: 8 }}
          >
            <HStack>
              <Button
                onClick={() => handleStepClick(1)}
                variant="unstyled"
                pointerEvents={step === "1" || !step ? "none" : "initial"}
                color={step === "1" || !step ? "metloBlue" : "initial"}
              >
                Get Started
              </Button>
              <BiChevronRightCircle />
            </HStack>
          </WrapItem>
          <WrapItem
            w={{ base: "full", sm: "unset" }}
            pr={{ base: 0, sm: 2, md: 4, lg: 8 }}
          >
            <HStack>
              <Button
                onClick={() => handleStepClick(2)}
                variant="unstyled"
                pointerEvents={step === "2" ? "none" : "initial"}
                color={step === "2" ? "metloBlue" : "initial"}
              >
                Set up Connection
              </Button>
              <BiChevronRightCircle />
            </HStack>
          </WrapItem>
          <WrapItem w={{ base: "full", sm: "unset" }}>
            <Button
              onClick={() => handleStepClick(3)}
              variant="unstyled"
              pointerEvents={step === "3" ? "none" : "initial"}
              color={step === "3" ? "metloBlue" : "initial"}
            >
              Listen for Requests
            </Button>
          </WrapItem>
        </Wrap>
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
