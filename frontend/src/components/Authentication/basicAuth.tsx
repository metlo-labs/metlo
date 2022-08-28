import { Box, HStack, Input, VStack, Text } from "@chakra-ui/react"
import { AuthType } from "@common/testing/enums"
import { Authorization, Request } from "@common/testing/types"
import { useEffect, useState } from "react"

interface basicAuthInterface {
  evaluate: (v: () => Authorization) => void
}
const BasicAuth: React.FC<basicAuthInterface> = ({ evaluate }) => {
  const [userName, setUserName] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    evaluate(() => {
      return {
        type: AuthType.BASIC_AUTH,
        params: { username: userName, password: password },
      }
    })
  }, [userName, password, evaluate])

  return (
    <VStack w="full" h="full">
      <HStack w="full" justifyContent="space-between">
        <Text fontWeight="semibold">User Name</Text>
        <Input
          w="sm"
          value={userName}
          onChange={v => setUserName(v.target.value)}
          placeholder="User Name"
          bg="white"
        />
      </HStack>
      <HStack w="full" justifyContent="space-between">
        <Text fontWeight="semibold">Password</Text>
        <Input
          w="sm"
          value={password}
          onChange={v => setPassword(v.target.value)}
          placeholder="Password"
          type="password"
          bg="white"
        />
      </HStack>
    </VStack>
  )
}
export default BasicAuth
