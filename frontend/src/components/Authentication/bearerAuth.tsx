import { Box, HStack, Input, VStack, Text } from "@chakra-ui/react"
import { AuthType, Authorization, AuthBearerParams } from "@metlo/testing"
import { useEffect, useState } from "react"

interface basicAuthInterface {
  params: AuthBearerParams
  setParams: (t: (e: AuthBearerParams) => AuthBearerParams) => void
}
const BearerAuth: React.FC<basicAuthInterface> = ({ params, setParams }) => {
  return (
    <VStack w="full">
      <HStack w="full" justifyContent="space-between">
        <Text fontWeight="semibold">Bearer Token</Text>
        <Input
          w="sm"
          bg="white"
          value={params.bearer_token}
          onChange={v =>
            setParams(e => ({ ...e, bearer_token: v.target.value }))
          }
          placeholder="BearerToken"
        />
      </HStack>
    </VStack>
  )
}
export default BearerAuth
