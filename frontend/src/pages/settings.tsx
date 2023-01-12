import { useRouter } from "next/router"
import {
  Box,
  Button,
  Heading,
  HStack,
  Link,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  TabProps,
  Tabs,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react"
import { ApiKey, WebhookResp } from "@common/types"
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
import { getWebhooks } from "api/webhook"
import { Integrations } from "components/Integrations"
import { getHosts } from "api/endpoints"
import { SettingsTab } from "enums"
import { GrDocumentConfig } from "icons/gr/GrDocumentConfig"
import { AiOutlineCode } from "icons/ai/AiOutlineCode"
import { VscKey } from "icons/vsc/VscKey"

export const getServerSideProps: GetServerSideProps = async context => {
  const [apiKeys, webhooks, hosts] = await Promise.all([
    getKeys(),
    getWebhooks(),
    getHosts(),
  ])
  let metloConfig = ""
  try {
    metloConfig = (await getMetloConfig()).configString
  } catch (err) {}

  return {
    props: {
      keys: superjson.stringify(apiKeys),
      metloConfig,
      webhooks: superjson.stringify(webhooks),
      hosts,
    },
  }
}

const Settings = ({ keys: _keysString, metloConfig, webhooks, hosts }) => {
  const [keys, setKeys] = useState<Array<ApiKey>>(superjson.parse(_keysString))
  const [parsedWebhooks, setParsedWebhooks] = useState<WebhookResp[]>(
    superjson.parse(webhooks),
  )
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
  const router = useRouter()
  const { tab } = router.query

  const getTab = () => {
    switch (tab) {
      case SettingsTab.KEYS:
        return 0
      case SettingsTab.CONFIG:
        return 1
      case SettingsTab.INTEGRATIONS:
        return 2
      default:
        return 0
    }
  }

  const handleTabClick = (newTab: SettingsTab) => {
    let routerParams = {}
    if (newTab) {
      routerParams["query"] = { tab: newTab }
    }
    router.push(routerParams, undefined, {
      shallow: true,
    })
  }

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

  const tabStyles: TabProps = {
    _hover: { bg: "#F7FBFF" },
    as: "button",
    px: 4,
    py: 6,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    textAlign: "start",
    w: "full",
    borderBottomWidth: 1,
  }

  return (
    <PageWrapper title="Settings">
      <Tabs
        variant="unstyled"
        orientation="vertical"
        index={getTab()}
        w="full"
        h="full"
        alignItems="flex-start"
      >
        <HStack
          borderTopWidth={{ base: 1, md: 0 }}
          spacing={0}
          alignItems="flex-start"
          w="full"
        >
          <VStack
            spacing="0"
            h="100vh"
            bg="white"
            w={{ base: "150px", lg: "300px" }}
            minW={{ base: "150px", lg: "300px" }}
            borderRightWidth={1}
          >
            <Box w="full" p={4} borderBottomWidth={1}>
              <Heading fontWeight="medium" size="lg">
                Settings
              </Heading>
            </Box>
            <TabList borderInlineStart="0" w="full" alignItems="flex-start">
              <Tab
                bg={getTab() === 0 ? "#F7FBFF" : "inital"}
                {...tabStyles}
                onClick={() => handleTabClick(null)}
              >
                <Stack
                  w="full"
                  alignItems="center"
                  direction={{ base: "column", lg: "row" }}
                  spacing={4}
                >
                  <VscKey size="20px" />
                  <Text fontWeight="medium">API Keys</Text>
                </Stack>
              </Tab>
              <Tab
                bg={getTab() === 1 ? "#F7FBFF" : "inital"}
                {...tabStyles}
                onClick={() => handleTabClick(SettingsTab.CONFIG)}
              >
                <Stack
                  w="full"
                  alignItems="center"
                  direction={{ base: "column", lg: "row" }}
                  spacing={4}
                >
                  <GrDocumentConfig size="20px" />
                  <Text fontWeight="medium">Metlo Config</Text>
                </Stack>
              </Tab>
              <Tab
                bg={getTab() === 2 ? "#F7FBFF" : "inital"}
                {...tabStyles}
                onClick={() => handleTabClick(SettingsTab.INTEGRATIONS)}
              >
                <Stack
                  w="full"
                  alignItems="center"
                  direction={{ base: "column", lg: "row" }}
                  spacing={4}
                >
                  <AiOutlineCode size="20px" />
                  <Text fontWeight="medium">Integrations</Text>
                </Stack>
              </Tab>
            </TabList>
          </VStack>
          <TabPanels w="full" overflow="auto" p={6} h="100vh">
            <TabPanel px="0" w="full" h="full">
              <HStack w="full" justifyContent="space-between" mb={4}>
                <Heading fontWeight="semibold" size="xl">
                  API Keys
                </Heading>
                <Button variant="create" onClick={onOpen}>
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
              <VStack
                w="full"
                alignItems="flex-start"
                borderWidth="1px"
                rounded="lg"
                spacing="0"
                overflow="hidden"
              >
                <Box w="full">
                  <ListKeys keys={keys} setKeys={setKeys} />
                </Box>
              </VStack>
            </TabPanel>
            <TabPanel w="full" px="0" h="full">
              <HStack
                w="full"
                justifyContent="space-between"
                mb={4}
                alignItems="start"
              >
                <VStack w="full" alignItems="flex-start">
                  <Heading fontWeight="semibold" size="xl">
                    Metlo Config
                  </Heading>

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
                </VStack>
                <Button
                  variant="create"
                  onClick={() => updateMetloConfigHandler()}
                  isLoading={updatingMetloConfig}
                >
                  Save
                </Button>
              </HStack>
              <Box rounded="md" h="700px" w="full" borderWidth="1px">
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
            <TabPanel px="0" w="full" h="full">
              <Heading fontWeight="semibold" size="xl" mb={4}>
                Integrations
              </Heading>
              <Integrations
                webhooks={parsedWebhooks}
                setWebhooks={setParsedWebhooks}
                hostList={hosts}
              />
            </TabPanel>
          </TabPanels>
        </HStack>
      </Tabs>
    </PageWrapper>
  )
}

export default Settings
