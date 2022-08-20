import {
  Box,
  Hide,
  HStack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorMode,
  VStack,
  Text,
  StackDivider,
  Flex,
} from "@chakra-ui/react";
import { Result } from "@common/testing/types";

import EmptyView from "../utils/EmptyView";
import { SectionHeader } from "../utils/Card";
import { statusToColor } from "../../constants";
import DataPreview from "./dataPreview";

const Response: React.FC<{ res: Result }> = ({ res }) => {
  const { colorMode } = useColorMode();
  return (
    <VStack p={0}>
      <Tabs
        w={"full"}
        size={"sm"}
        gap={4}
        flexDir="column"
        flexGrow="1"
        overflow="hidden"
        px={0}
      >
        <Flex w={"full"}>
          <TabList
            w={"full"}
            fontSize={"xs"}
            gap={4}
            borderBottom="none"
            flex={{ md: "75%", base: "100%" }}
          >
            <Tab>
              <SectionHeader text="Body" />
            </Tab>
            <Tab>
              <SectionHeader text="Cookies" />
            </Tab>
            <Tab>
              <SectionHeader text="Headers" />
            </Tab>
            <Tab>
              <SectionHeader text="Test Results" />
            </Tab>
          </TabList>

          <Box flex={{ md: "25%", base: "none" }}>
            <Hide below="md">
              <HStack w="full" justifyContent="flex-end" pr={4}>
                {res.duration && <Box fontSize={"xs"}>{res.duration} ms</Box>}
                {res.code && (
                  <Box fontSize={"xs"} color={statusToColor(res.code)}>
                    {res.code} {res.statusText}
                  </Box>
                )}
                {
                  <Box fontSize={"xs"}>
                    {(res.headers["content-length"] || res.body) &&
                      `${
                        res.headers["content-length"] ||
                        JSON.stringify(res.body).length
                      } B`}
                  </Box>
                }
              </HStack>
            </Hide>
          </Box>
        </Flex>

        <TabPanels>
          <TabPanel p={0}>
            <DataPreview res={res} />
          </TabPanel>
          <TabPanel p={0}>
            <EmptyView />
          </TabPanel>
          <TabPanel p={0}>
            <VStack
              w="full"
              divider={<StackDivider />}
              spacing="0"
              borderBottom="1px"
              borderColor="gray.200"
              pt={4}
            >
              {res.headers.length >= 0 ? <StackDivider /> : null}
              {Object.values(res.headers).map((e, i) => {
                return (
                  <HStack
                    key={i}
                    spacing="0"
                    w="full"
                    divider={<StackDivider />}
                  >
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
          <TabPanel p={0}>
            <EmptyView />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};
export default Response;
