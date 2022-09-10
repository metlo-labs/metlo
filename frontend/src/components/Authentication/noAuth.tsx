import { Box } from "@chakra-ui/react"
import EmptyView from "../utils/EmptyView"

const NoAuth: React.FC = () => {
  return (
    <Box>
      <EmptyView text="This request does not use any authorization" />
    </Box>
  )
}
export default NoAuth
