import React from "react"
import { Input, HStack, Button, Box, useColorModeValue } from "@chakra-ui/react"
import { Request } from "@metlo/testing"
import Select from "react-select"
import { RestMethod } from "@common/enums"
import { getMethodSelectStyles } from "./styles"

interface URLHeaderProps {
  method: RestMethod
  url: string
  sendSelectedRequest: () => void
  fetching: boolean
  updateRequest: (t: (e: Request) => Request) => void
}

const URLHeader: React.FC<URLHeaderProps> = React.memo(
  ({ method, url, fetching, sendSelectedRequest, updateRequest }) => {
    const methodMenuBg = useColorModeValue("white", "rgb(19, 22, 26)")
    const methodTextColor = useColorModeValue("black", "rgb(236, 233, 229)")
    const methodHighlightColor = useColorModeValue(
      "rgb(230, 224, 216)",
      "rgb(25, 31, 39)",
    )
    return (
      <HStack w="full" spacing="0" px="4" pt="4" pb="2">
        <Box w="36">
          <Select
            id="test-request-method-selector"
            instanceId="test-request-method-selector"
            styles={getMethodSelectStyles(
              methodMenuBg,
              methodTextColor,
              methodHighlightColor,
            )}
            options={Object.entries(RestMethod).map(e => ({
              value: e[1],
              label: e[1],
            }))}
            value={{
              value: method,
              label: method,
            }}
            onChange={e => updateRequest(old => ({ ...old, method: e.value }))}
          />
        </Box>
        <Input
          placeholder="URL"
          rounded="none"
          bg="secondaryBG"
          value={url}
          onChange={evt =>
            updateRequest(old => ({ ...old, url: evt.target.value }))
          }
          flexGrow="1"
        />
        <Button
          colorScheme="blue"
          px="8"
          roundedLeft="none"
          onClick={sendSelectedRequest}
          isLoading={fetching}
        >
          Send
        </Button>
      </HStack>
    )
  },
)

export default URLHeader
