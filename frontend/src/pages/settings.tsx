import {
  Box,
  Button,
  Heading,
  HStack,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react"
import { ApiKey } from "@common/types"
import { getKeys, addKey as addKeyReq } from "api/keys"
import KeyAddedModal from "components/Keys/keyAddedPrompt"
import NewKeys from "components/Keys/newKeys"
import ListKeys from "components/Keys/list"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { ContentContainer } from "components/utils/ContentContainer"
import { GetServerSideProps } from "next"
import { useState } from "react"
import superjson from "superjson"
import { makeToast } from "utils"

export const getServerSideProps: GetServerSideProps = async context => {
  const apiKeys = await getKeys()

  return {
    props: {
      keys: superjson.stringify(apiKeys),
    },
  }
}

const Keys = ({ keys: _keysString }) => {
  const [keys, setKeys] = useState<Array<ApiKey>>(superjson.parse(_keysString))
  const [[newKey, newKeyName], setNewKeyValue] = useState<[string, string]>([
    "",
    "",
  ])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const {
    isOpen: isNewKeyOpen,
    onOpen: onNewKeyOpen,
    onClose: onNewKeyClose,
  } = useDisclosure()
  const [isAddingKey, setIsAddingKey] = useState(false)
  const toast = useToast()

  const addKey = async (key_name: string) => {
    setIsAddingKey(true)
    try {
      let resp = await addKeyReq(key_name)
      console.log(resp)
      let new_keys = [...keys]
      new_keys.push({
        name: resp.name,
        identifier: resp.identifier,
        created: resp.created,
        for: resp.for,
      })
      console.log(new_keys)
      setKeys(new_keys)
      setNewKeyValue([resp.apiKey, resp.name])
      onNewKeyOpen()
    } catch (err) {
      toast(makeToast({
        title: "Adding new key failed",
        status: "error",
        description: err.response?.data
      }, err.response?.status))
    } finally {
      setIsAddingKey(false)
      onClose()
    }
  }

  return (
    <SidebarLayoutShell
      title="API Specs"
      currentTab={SideNavLinkDestination.Settings}
    >
      <ContentContainer>
        <Heading fontWeight="medium" size="lg" mb="4">
          API Keys
        </Heading>
        <VStack
          w="full"
          alignItems="flex-start"
          borderWidth="1px"
          rounded="md"
          spacing="0"
          overflow="hidden"
        >
          <Box p="4" borderBottom="1px" borderColor="inherit" w="full">
            <HStack justifyContent="space-between">
              <Box />
              <Button colorScheme="blue" onClick={onOpen}>
                New
              </Button>
              <NewKeys
                isOpen={isOpen}
                onClose={onClose}
                onCreate={addKey}
                isAddingKey={isAddingKey}
              />
              <KeyAddedModal
                newKey={newKey}
                newKeyName={newKeyName}
                isOpen={isNewKeyOpen}
                onClose={onNewKeyClose}
              />
            </HStack>
          </Box>
          <Box w="full">
            <ListKeys keys={keys} setKeys={setKeys} />
          </Box>
        </VStack>
      </ContentContainer>
    </SidebarLayoutShell>
  )
}

export default Keys
