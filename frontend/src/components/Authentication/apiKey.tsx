import { Text, HStack, Input, Select, VStack } from "@chakra-ui/react"
import { APIKeyAuthAddTo, AuthAPIKeyParams } from "@metlo/testing"

interface apiAuthInterface {
  params: AuthAPIKeyParams
  setParams: (t: (e: AuthAPIKeyParams) => AuthAPIKeyParams) => void
}
const APIAuth: React.FC<apiAuthInterface> = ({ params, setParams }) => {
  return (
    <VStack>
      <HStack w="full" justifyContent="space-between" alignItems="center">
        <Text fontWeight="semibold">Key</Text>
        <Input
          w="sm"
          bg="white"
          value={params.key}
          onChange={v => setParams(e => ({ ...e, key: v.target.value }))}
          placeholder="Key"
        />
      </HStack>
      <HStack w="full" justifyContent="space-between" alignItems="center">
        <Text fontWeight="semibold">Value</Text>
        <Input
          w="sm"
          bg="white"
          value={params.value}
          onChange={v => setParams(e => ({ ...e, value: v.target.value }))}
          placeholder="Value"
        />
      </HStack>
      <HStack w="full" justifyContent="space-between" alignItems="center">
        <Text fontWeight="semibold">Add To</Text>
        <Select
          w="sm"
          bg="white"
          value={params.add_to}
          onChange={v =>
            setParams(e => ({
              ...e,
              add_to: v.target.value as APIKeyAuthAddTo,
            }))
          }
        >
          <option value={APIKeyAuthAddTo.HEADERS}>Headers</option>
          <option value={APIKeyAuthAddTo.QUERY_PARAMS}>Query Params</option>
        </Select>
      </HStack>
    </VStack>
  )
}
export default APIAuth
