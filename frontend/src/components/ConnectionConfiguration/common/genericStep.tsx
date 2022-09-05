import { Flex, Spinner } from "@chakra-ui/react"
import { useEffect } from "react"

interface GenericStepAWSInterface {
  id: string
  complete: (params: Record<string, any>) => void
  isCurrent: boolean
}

const GenericStep: React.FC<GenericStepAWSInterface> = ({
  id,
  complete,
  isCurrent,
}) => {
  useEffect(() => {
    if (isCurrent) {
      complete({})
    }
  }, [isCurrent, complete])

  return (
    <Flex w={"full"} h={"full"} justify={"center"} mt={8}>
      <Spinner size={"xl"} />
    </Flex>
  )
}

export default GenericStep
