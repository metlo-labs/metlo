import { useRouter } from "next/router"
import {
  Box,
  Button,
  Grid,
  GridItem,
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
  useBreakpointValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react"
import { ApiKey, OpenApiSpec, WebhookResp } from "@common/types"
import { getKeys, addKey as addKeyReq } from "api/keys"
import { getMetloConfig, updateMetloConfig } from "api/metlo-config"
import KeyAddedModal from "components/Keys/keyAddedPrompt"
import NewKeys from "components/Keys/newKeys"
import ListKeys from "components/Keys/list"
import { PageWrapper } from "components/PageWrapper"
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
import BulkActions from "components/Settings/BulkActions"
import { getTestingConfig } from "api/testing-config"
import { BiTestTube } from "icons/bi/BiTestTube"
import { TestingConfig } from "components/TestingConfig"
import { AiFillApi } from "icons/ai/AiFillApi"
import { FaShareAlt } from "icons/fa/FaShareAlt"
import SpecList from "components/SpecList"
import { getSpecs } from "api/apiSpecs"
import ConnectionDocsList from "components/ConnectionDocs"

export const getServerSideProps: GetServerSideProps = async context => {
  const [apiKeys, webhooks, hosts, specs] = await Promise.all([
    getKeys(),
    getWebhooks(),
    getHosts(),
    getSpecs(),
  ])
  let metloConfig = ""
  let testingConfig = ""
  try {
    const [metloConfigResp, testingConfigResp] = await Promise.allSettled([
      getMetloConfig(),
      getTestingConfig(),
    ])
    if (metloConfigResp.status === "fulfilled") {
      metloConfig = metloConfigResp.value?.configString ?? ""
    }
    if (testingConfigResp.status === "fulfilled") {
      testingConfig = testingConfigResp.value?.configString ?? ""
    }
  } catch (err) {}

  return {
    props: {
      keys: superjson.stringify(apiKeys),
      metloConfig,
      webhooks: superjson.stringify(webhooks),
      specs: superjson.stringify(specs),
      hosts,
      testingConfig,
    },
  }
}

const Settings = ({
  keys: _keysString,
  metloConfig,
  webhooks,
  hosts,
  specs,
  testingConfig,
}) => {
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
  const selectedColor = "rgb(240, 240, 242)"
  const toast = useToast()
  const router = useRouter()
  const { tab } = router.query

  const getTab = () => {
    switch (tab) {
      case SettingsTab.KEYS:
        return 0
      case SettingsTab.CONFIG:
        return 1
      case SettingsTab.TESTING_CONFIG:
        return 2
      case SettingsTab.API_SPECS:
        return 3
      case SettingsTab.CONNECTIONS:
        return 4
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
    _hover: { bg: selectedColor },
    as: "button",
    px: { base: 2, sm: 4 },
    py: { base: 4, sm: 6 },
    justifyContent: "flex-start",
    alignItems: "flex-start",
    textAlign: "start",
    w: { base: "full", md: "full" },
    fontSize: { base: "xs", sm: "md" },
    h: "full",
    borderBottomWidth: 1,
  }
  const orientation = useBreakpointValue({ base: "horizontal", md: "vertical" })

  return (
    <PageWrapper title="Settings">
      <Tabs
        variant="unstyled"
        orientation={orientation as "horizontal" | "vertical"}
        index={getTab()}
        w="full"
        h="full"
        alignItems="flex-start"
      >
        <Stack
          direction={{ base: "column", md: "row" }}
          borderTopWidth={{ base: 1, md: 0 }}
          spacing={0}
          h={{ base: "unset", md: "full" }}
          alignItems="flex-start"
          w="full"
        >
          <TabList
            borderInlineStart="0"
            h="full"
            w={{ base: "full", md: "200px", lg: "300px" }}
            minW={{ base: "full", md: "200px", lg: "300px" }}
            alignItems={{ base: "initial", md: "flex-start" }}
            borderRightWidth={{ base: 0, md: 1 }}
          >
            <Grid
              templateColumns={{ base: "repeat(5, 1fr)", md: "1fr" }}
              templateRows={{ base: "1fr", md: "repeat(5, 1fr)" }}
              gap="0"
              w="full"
            >
              <GridItem h="full">
                <Tab
                  bg={getTab() === 0 ? selectedColor : "inital"}
                  {...tabStyles}
                  borderRightWidth={{ base: 1, md: 0 }}
                  onClick={() => handleTabClick(null)}
                >
                  <Stack
                    w="full"
                    alignItems="center"
                    textAlign="center"
                    direction={{ base: "column", md: "row" }}
                    spacing={4}
                  >
                    <VscKey size="20px" />
                    <Text fontWeight="medium">API Keys</Text>
                  </Stack>
                </Tab>
              </GridItem>
              <GridItem h="full">
                <Tab
                  bg={getTab() === 1 ? selectedColor : "inital"}
                  {...tabStyles}
                  borderRightWidth={{ base: 1, md: 0 }}
                  onClick={() => handleTabClick(SettingsTab.CONFIG)}
                >
                  <Stack
                    w="full"
                    alignItems="center"
                    textAlign="center"
                    direction={{ base: "column", md: "row" }}
                    spacing={4}
                  >
                    <GrDocumentConfig size="20px" />
                    <Text fontWeight="medium">Metlo Config</Text>
                  </Stack>
                </Tab>
              </GridItem>
              <GridItem h="full">
                <Tab
                  bg={getTab() === 2 ? selectedColor : "inital"}
                  {...tabStyles}
                  borderRightWidth={{ base: 1, md: 0 }}
                  onClick={() => handleTabClick(SettingsTab.TESTING_CONFIG)}
                >
                  <Stack
                    w="full"
                    alignItems="center"
                    textAlign="center"
                    direction={{ base: "column", md: "row" }}
                    spacing={4}
                  >
                    <BiTestTube size="20px" />
                    <Text fontWeight="medium">Testing Config</Text>
                  </Stack>
                </Tab>
              </GridItem>
              <GridItem h="full">
                <Tab
                  bg={getTab() === 3 ? selectedColor : "inital"}
                  {...tabStyles}
                  borderRightWidth={{ base: 1, md: 0 }}
                  onClick={() => handleTabClick(SettingsTab.API_SPECS)}
                >
                  <Stack
                    w="full"
                    alignItems="center"
                    textAlign="center"
                    direction={{ base: "column", md: "row" }}
                    spacing={4}
                  >
                    <AiFillApi size="20px" />
                    <Text fontWeight="medium">API Specs</Text>
                  </Stack>
                </Tab>
              </GridItem>
              <GridItem h="full">
                <Tab
                  bg={getTab() === 4 ? selectedColor : "inital"}
                  {...tabStyles}
                  borderRightWidth={{ base: 1, md: 0 }}
                  onClick={() => handleTabClick(SettingsTab.CONNECTIONS)}
                >
                  <Stack
                    w="full"
                    alignItems="center"
                    textAlign="center"
                    direction={{ base: "column", md: "row" }}
                    spacing={4}
                  >
                    <FaShareAlt size="20px" />
                    <Text fontWeight="medium">Connections</Text>
                  </Stack>
                </Tab>
              </GridItem>
            </Grid>
          </TabList>
          <TabPanels w="full" overflow="auto" px={6} py={2} h="full">
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
              <VStack w="full" spacing="8" pb="8">
                <VStack w="full">
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
                  <Box rounded="md" h="600px" w="full" borderWidth="1px">
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
                </VStack>
                <BulkActions />
              </VStack>
            </TabPanel>
            <TabPanel px="0" w="full" h="full">
              <TestingConfig configString={testingConfig} />
            </TabPanel>
            <TabPanel px="0" w="full" h="full">
              <Heading fontWeight="semibold" size="xl" mb={4}>
                Api Specs
              </Heading>
              <SpecList apiSpecs={superjson.parse<OpenApiSpec[]>(specs)} />
            </TabPanel>
            <TabPanel px="0" w="full" h="full">
              <Heading fontWeight="semibold" size="xl" mb={4}>
                Connections
              </Heading>
              <Text fontWeight="medium" pb="6">
                Set up a Connection to send API traffic to Metlo. You can
                generate an API Key on the{" "}
                <Link href="/settings">settings page.</Link>
              </Text>
              <ConnectionDocsList />
            </TabPanel>
          </TabPanels>
        </Stack>
      </Tabs>
    </PageWrapper>
  )
}

export default Settings
