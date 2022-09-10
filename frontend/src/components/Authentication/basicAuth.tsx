import { HStack, Input, VStack, Text } from "@chakra-ui/react"
import { AuthBasicAuthParams } from "@metlo/testing"

interface basicAuthInterface {
  params: AuthBasicAuthParams
  setParams: (t: (e: AuthBasicAuthParams) => AuthBasicAuthParams) => void
}
const BasicAuth: React.FC<basicAuthInterface> = ({ params, setParams }) => {
  return (
    <VStack w="full" h="full">
      <HStack w="full" justifyContent="space-between">
        <Text fontWeight="semibold">User Name</Text>
        <Input
          w="sm"
          value={params.username}
          onChange={v => setParams(e => ({ ...e, username: v.target.value }))}
          placeholder="User Name"
          bg="white"
        />
      </HStack>
      <HStack w="full" justifyContent="space-between">
        <Text fontWeight="semibold">Password</Text>
        <Input
          w="sm"
          value={params.password}
          onChange={v => setParams(e => ({ ...e, password: v.target.value }))}
          placeholder="Password"
          type="password"
          bg="white"
        />
      </HStack>
    </VStack>
  )
}
export default BasicAuth
