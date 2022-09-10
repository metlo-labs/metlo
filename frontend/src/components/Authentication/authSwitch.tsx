import { Box, HStack, Select, StackDivider, VStack } from "@chakra-ui/react"
import {
  AuthType,
  Authorization,
  Request,
  AuthAPIKeyParams,
  AuthBasicAuthParams,
  AuthBearerParams,
  APIKeyAuthAddTo,
} from "@metlo/testing"
import React from "react"
import APIAuth from "./apiKey"
import BasicAuth from "./basicAuth"
import BearerAuth from "./bearerAuth"
import NoAuth from "./noAuth"

const getDefaultParams = (type: AuthType) => {
  switch (type) {
    case AuthType.API_KEY:
      return {
        key: "",
        value: "",
        add_to: APIKeyAuthAddTo.HEADERS,
      } as AuthAPIKeyParams
    case AuthType.BASIC_AUTH:
      return {
        username: "",
        password: "",
      } as AuthBasicAuthParams
    case AuthType.BEARER:
      return {
        bearer_token: "",
      } as AuthBearerParams
    case AuthType.NO_AUTH:
      return {}
  }
}
const DEFAULT_AUTH: Authorization = {
  type: AuthType.NO_AUTH,
  params: {},
}

interface AuthSwitchInterface {
  auth?: Authorization
  setRequest: (t: (e: Request) => Request) => void
}

const AuthSwitch: React.FC<AuthSwitchInterface> = React.memo(
  ({ auth, setRequest }) => {
    auth = auth || DEFAULT_AUTH
    const updateAuth = (t: (e: Authorization) => Authorization) => {
      setRequest(e => ({
        ...e,
        authorization: t(e.authorization || DEFAULT_AUTH),
      }))
    }
    const updateAuthParams = (t: (e: any) => any) => {
      updateAuth(e => ({
        ...e,
        params: t(e.params),
      }))
    }
    const getAuthComponent = (authType: AuthType) => {
      switch (authType) {
        case AuthType.API_KEY:
          return (
            <APIAuth
              params={auth.params as AuthAPIKeyParams}
              setParams={updateAuthParams}
            />
          )
        case AuthType.BASIC_AUTH:
          return (
            <BasicAuth
              params={auth.params as AuthBasicAuthParams}
              setParams={updateAuthParams}
            />
          )
        case AuthType.NO_AUTH:
          return <NoAuth />
        case AuthType.BEARER:
          return (
            <BearerAuth
              params={auth.params as AuthBearerParams}
              setParams={updateAuthParams}
            />
          )
      }
    }
    return (
      <VStack divider={<StackDivider />} spacing="0" h="full">
        <HStack w="full" px="4" py="2">
          <Box w="full">Type</Box>
          <Box w="full">
            <Select
              value={auth.type}
              onChange={v =>
                updateAuth(e => ({
                  ...e,
                  type: v.target.value as AuthType,
                  params: getDefaultParams(v.target.value as AuthType),
                }))
              }
            >
              {Object.values(AuthType).map((v, i) => (
                <option value={v} key={i}>
                  {v}
                </option>
              ))}
            </Select>
          </Box>
        </HStack>
        <Box w="full" px="4" py="2" bg="secondaryBG" flexGrow="1">
          {getAuthComponent(auth.type)}
        </Box>
      </VStack>
    )
  },
)
export default AuthSwitch
