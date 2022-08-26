import { Box, HStack, Select, StackDivider, VStack } from "@chakra-ui/react"
import { AuthType } from "@common/testing/enums"
import { Authorization, Request } from "@common/testing/types"
import React, { useCallback } from "react"
import APIAuth from "./apiKey"
import BasicAuth from "./basicAuth"
import BearerAuth from "./bearerAuth"
import NoAuth from "./noAuth"

interface AuthSwitchInterface {
  variant: AuthType
  setVariant: (value: AuthType) => void
  setRequest: (t: (e: Request) => Request) => void
}

const AuthSwitch: React.FC<AuthSwitchInterface> = React.memo(
  ({ variant, setVariant, setRequest }) => {
    const onAuthParamsChange = useCallback(
      (v: () => Authorization) => {
        setRequest(request => ({ ...request, authorization: v() }))
      },
      [setRequest],
    )
    const getAuthComponent = (auth: AuthType) => {
      switch (auth) {
        case AuthType.API_KEY:
          return <APIAuth evaluate={onAuthParamsChange} />
        case AuthType.BASIC_AUTH:
          return <BasicAuth evaluate={onAuthParamsChange} />
        case AuthType.NO_AUTH:
          return <NoAuth evaluate={onAuthParamsChange} />
        case AuthType.BEARER:
          return <BearerAuth evaluate={onAuthParamsChange} />
      }
    }
    return (
      <VStack divider={<StackDivider />}>
        <HStack w="full">
          <Box w="full">Type</Box>
          <Box w="full">
            <Select
              value={variant}
              onChange={v => setVariant(v.target.value as AuthType)}
            >
              {Object.values(AuthType).map((v, i) => (
                <option value={v} key={i}>
                  {v}
                </option>
              ))}
            </Select>
          </Box>
        </HStack>
        <Box w="full">{getAuthComponent(variant)}</Box>
      </VStack>
    )
  },
)
export default AuthSwitch
