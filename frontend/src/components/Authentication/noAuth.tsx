import { Box } from "@chakra-ui/react"
import { useEffect } from "react"
import { Authorization, AuthType } from "@metlo/testing"
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
      <EmptyView text="This request does not use any authorization" />
    </Box>
  )
}
export default NoAuth
