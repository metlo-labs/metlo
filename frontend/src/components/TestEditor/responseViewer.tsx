import React from "react";
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
} from "@chakra-ui/react";
import { Result } from "@common/testing/types";
import EmptyView from "../utils/EmptyView";
import { SectionHeader } from "../utils/Card";
import { statusToColor } from "../../constants";
import DataPreview from "./dataPreview";

const Response: React.FC<{ res: Result }> = React.memo(({ res }) => {
  const tabsBG = useColorModeValue("white", "black")
  if (!res) {
    return null;
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
          <Tab>
            <SectionHeader text="Test Results" />
          </Tab>
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
      <TabPanels flexGrow="1">
        <TabPanel p="0" h="full">
          <DataPreview res={res} />
        </TabPanel>
        <TabPanel p="0">
          <VStack
            w="full"
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
              );
            })}
          </VStack>
        </TabPanel>
        <TabPanel p="0">
          <EmptyView />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
});

export default Response;
