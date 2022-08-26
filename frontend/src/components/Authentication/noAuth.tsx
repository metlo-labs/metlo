import { Box, Input, Select } from "@chakra-ui/react"
import { APIKeyAuthAddTo, AuthType } from "@common/testing/enums"
import { Authorization, Request } from "@common/testing/types"
import { useEffect, useState } from "react"
import EmptyView from "../utils/EmptyView"

interface apiAuthInterface {
  evaluate: (v: () => Authorization) => void
}
const NoAuth: React.FC<apiAuthInterface> = ({ evaluate }) => {
  useEffect(() => {
    evaluate(() => {
      return {
        type: AuthType.NO_AUTH,
        params: {},
      }
    })
  }, [evaluate])

  return (
    <Box>
      <EmptyView text={"This request does not use any authorization"} />
    </Box>
  )
}
export default NoAuth
