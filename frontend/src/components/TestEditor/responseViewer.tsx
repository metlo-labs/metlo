import React from "react"
import {
  HStack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
  Text,
  StackDivider,
  Flex,
  useColorModeValue,
  Heading,
} from "@chakra-ui/react"
import { Result } from "@common/testing/types"
import { SectionHeader } from "../utils/Card"
import { statusToColor } from "../../constants"
import { BiCheckCircle } from "@react-icons/all-files/bi/BiCheckCircle"
import { GiCancel } from "@react-icons/all-files/gi/GiCancel"
import DataPreview from "./dataPreview"
import EmptyView from "components/utils/EmptyView"

const Response: React.FC<{ res: Result }> = React.memo(({ res }) => {
  const tabsBG = useColorModeValue("white", "black")
  if (!res) {
    return (
      <EmptyView minH="unset" h="full">
        <Text
          fontSize="xl"
          fontWeight="semibold"
          textAlign="center"
          color="gray.400"
        >
          Hit Send to get a response...
        </Text>
      </EmptyView>
    )
  }

  let testTab = (
    <Heading size="sm" fontWeight="semibold">
      Test Results
    </Heading>
  )
  if (res.testResults.length > 0) {
    const successTests = res.testResults.filter(e => e.success).length
    const successText = `(${successTests}/${res.testResults.length})`
    const color =
      successTests == res.testResults.length ? "green.500" : "red.500"
    testTab = (
      <HStack>
        {testTab}
        <Heading size="sm" fontWeight="semibold" color={color}>
          {successText}
        </Heading>
      </HStack>
    )
  }

  return (
    <Tabs
      w="full"
      height="full"
      size="sm"
      flexDir="column"
      display="flex"
      overflow="hidden"
      bg={tabsBG}
      px="0"
    >
      <Flex w="full" justifyContent="space-between">
        <TabList w="full" fontSize="xs" borderBottom="none">
          <Tab>
            <SectionHeader text="Body" />
          </Tab>
          <Tab>
            <SectionHeader text="Headers" />
          </Tab>
          <Tab>{testTab}</Tab>
        </TabList>
        <HStack w="full" justifyContent="flex-end" pr="4">
          <Text fontSize="xs">{res.duration} ms</Text>
          <Text fontSize="xs" color={statusToColor(res.code)}>
            {res.code} {res.statusText}
          </Text>
          <Text fontSize="xs">
            {(res.headers["content-length"] || res.body) &&
              `${
                res.headers["content-length"] || JSON.stringify(res.body).length
              } B`}
          </Text>
        </HStack>
      </Flex>
      <TabPanels flexGrow="1" overflow="hidden">
        <TabPanel p="0" h="full">
          <DataPreview res={res} />
        </TabPanel>
        <TabPanel p="0" h="full">
          <VStack
            w="full"
            h="full"
            overflow="scroll"
            divider={<StackDivider />}
            spacing="0"
            borderBottom="1px"
            borderColor="gray.200"
            pt="4"
          >
            {Object.values(res.headers).map((e, i) => {
              return (
                <HStack key={i} spacing="0" w="full" divider={<StackDivider />}>
                  <Text
                    rounded="none"
                    border="none"
                    w="50%"
                    fontWeight="medium"
                    fontSize="sm"
                    p="2"
                  >
                    {e.key}
                  </Text>
                  <Text
                    rounded="none"
                    border="none"
                    w="50%"
                    fontWeight="medium"
                    fontSize="sm"
                    p="2"
                  >
                    {e.value}
                  </Text>
                </HStack>
              )
            })}
          </VStack>
        </TabPanel>
        <TabPanel p="0" h="full">
          <VStack
            w="full"
            h="full"
            overflow="scroll"
            divider={<StackDivider />}
            spacing="0"
            borderBottom="1px"
            borderColor="gray.200"
            pt="4"
          >
            {Object.values(res.testResults).map((e, i) => {
              return (
                <HStack
                  key={i}
                  spacing="0"
                  w="full"
                  color={e.success ? "green.500" : "red.500"}
                >
                  <Text
                    rounded="none"
                    border="none"
                    fontWeight="medium"
                    fontSize="sm"
                    p="2"
                  >
                    {e.name}
                  </Text>
                  {e.success ? <BiCheckCircle /> : <GiCancel />}
                </HStack>
              )
            })}
          </VStack>
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
})

export default Response
