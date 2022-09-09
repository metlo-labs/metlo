import { Box, HStack, Input, VStack, Text } from "@chakra-ui/react"
import { AuthType, Authorization, AuthBearerParams } from "@metlo/testing"
import { useEffect, useState } from "react"

interface basicAuthInterface {
  evaluate: (v: () => Authorization) => void
}
const BearerAuth: React.FC<basicAuthInterface> = ({ evaluate }) => {
  const [bearerToken, setBearerToken] = useState("")

  useEffect(() => {
    evaluate(() => {
      return {
        type: AuthType.BEARER,
        params: { bearer_token: bearerToken } as AuthBearerParams,
      }
    })
  }, [bearerToken, evaluate])

  return (
    <VStack w="full">
      <HStack w="full" justifyContent="space-between">
        <Text fontWeight="semibold">Bearer Token</Text>
        <Input
          w="sm"
          bg="white"
          value={bearerToken}
          onChange={v => setBearerToken(v.target.value)}
          placeholder="BearerToken"
        />
      </HStack>
    </VStack>
  )
}
export default BearerAuth
