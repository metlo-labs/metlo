import {
  Box,
  Button,
  Heading,
  HStack,
  Link,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react"
import { ApiKey } from "@common/types"
import { getKeys, addKey as addKeyReq } from "api/keys"
import { getMetloConfig, updateMetloConfig } from "api/metlo-config"
import KeyAddedModal from "components/Keys/keyAddedPrompt"
import NewKeys from "components/Keys/newKeys"
import ListKeys from "components/Keys/list"
import { PageWrapper } from "components/PageWrapper"
import { ContentContainer } from "components/utils/ContentContainer"
import { GetServerSideProps } from "next"
import { useState } from "react"
import superjson from "superjson"
import { makeToast } from "utils"
import Editor from "@monaco-editor/react"
import { SectionHeader } from "components/utils/Card"

export const getServerSideProps: GetServerSideProps = async context => {
  const apiKeys = await getKeys()
  let metloConfig = ""
  try {
    metloConfig = (await getMetloConfig()).configString
  } catch (err) {}

  return {
    props: {
      keys: superjson.stringify(apiKeys),
      metloConfig,
    },
  }
}

const Settings = ({ keys: _keysString, metloConfig }) => {
  const [keys, setKeys] = useState<Array<ApiKey>>(superjson.parse(_keysString))
  const [configString, setConfigString] = useState<string>(metloConfig)
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
  const [updatingMetloConfig, setUpdatingMetloConfig] = useState(false)
  const toast = useToast()

  const addKey = async (key_name: string) => {
    setIsAddingKey(true)
    try {
      let resp = await addKeyReq(key_name)
      let new_keys = [...keys]
      new_keys.push({
        name: resp.name,
        identifier: resp.identifier,
        created: resp.created,
        for: resp.for,
      })
      setKeys(new_keys)
      setNewKeyValue([resp.apiKey, resp.name])
      onNewKeyOpen()
    } catch (err) {
      toast(
        makeToast(
          {
            title: "Adding new key failed",
            status: "error",
            description: err.response?.data,
          },
          err.response?.status,
        ),
      )
    } finally {
      setIsAddingKey(false)
      onClose()
    }
  }

  const updateMetloConfigHandler = async () => {
    setUpdatingMetloConfig(true)
    try {
      let resp = await updateMetloConfig(configString)
      if (resp === 200) {
        toast(
          makeToast({
            title: "Updated metlo config.",
            status: "success",
          }),
        )
      }
    } catch (err) {
      toast(
        makeToast({
          title: "Updating metlo config failed",
          status: "error",
          description: err.response?.data,
          duration: 15000,
        }),
      )
    } finally {
      setUpdatingMetloConfig(false)
    }
  }

  return (
    <PageWrapper title="API Specs">
      <ContentContainer maxContentW="100rem" px="8" py="8">
        <VStack h="full" w="full" alignItems="flex-start" spacing="0">
          <Heading fontWeight="medium" size="lg" mb="4">
            Settings
          </Heading>
          <Tabs w="full" display="flex" flexDir="column" flexGrow="1">
            <TabList>
              <Tab>
                <SectionHeader text="API Keys" />
              </Tab>
              <Tab>
                <SectionHeader text="Metlo Config" />
              </Tab>
            </TabList>
            <TabPanels flexGrow="1" h="full">
              <TabPanel px="0" overflow="auto" h="full">
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
              </TabPanel>
              <TabPanel px="0" overflow="auto" h="full">
                <HStack w="full" justifyContent="space-between" pb="15px">
                  <Text>
                    View our{" "}
                    <Link
                      target="_blank"
                      color="blue"
                      href="https://docs.metlo.com/docs/metlo-config"
                    >
                      docs
                    </Link>{" "}
                    on how to set up a metlo config.
                  </Text>
                  <Button
                    colorScheme="blue"
                    onClick={() => updateMetloConfigHandler()}
                    isLoading={updatingMetloConfig}
                  >
                    Save
                  </Button>
                </HStack>
                <Box pt="2" rounded="md" h="700px" w="full" borderWidth="1px">
                  <Editor
                    width="100%"
                    defaultLanguage="yaml"
                    value={configString}
                    onChange={val => setConfigString(val)}
                    options={{
                      minimap: {
                        enabled: false,
                      },
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                    }}
                  />
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </ContentContainer>
    </PageWrapper>
  )
}

export default Settings
