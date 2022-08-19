import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Box,
  ColorMode,
  useColorMode,
  HStack,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react";
import { SectionHeader } from "../utils/Card";
import EmptyView from "../utils/EmptyView";
import dynamic from "next/dynamic";

// CodeMirror default theme for light mode
import "codemirror/lib/codemirror.css";
// CodeMirror seti theme for dark mode
import "codemirror/theme/seti.css";
import { Result } from "@common/testing/types";

const CodeMirror = dynamic(
  () => {
    import("codemirror/mode/javascript/javascript");
    return import("react-codemirror");
  },
  { ssr: false }
);

interface DataPreviewInterface {
  res: Result;
}

const DataPreview: React.FC<DataPreviewInterface> = ({ res }) => {
  const { colorMode } = useColorMode();
  return (
    <Tabs
      w={"full"}
      size={"xs"}
      gap={4}
      px={0}
      py={2}
      variant={"line"}
      flexDir="column"
      flexGrow="1"
      overflow="hidden"
    >
      <TabList w={"full"} fontSize={"sm"} gap={4} borderBottom={"none"} pl={2}>
        <Tab>
          <SectionHeader text="Pretty" />
        </Tab>
        <Tab>
          <SectionHeader text="Raw" />
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel px={0} py={2}>
          {res.body ? (
            <CodeMirror
              value={res.body ? JSON.stringify(res.body, null, 4) : undefined}
              options={{
                mode: {
                  name: "javascript",
                  json: true,
                },
                lineNumbers: true,
                readOnly: true,
                theme:
                  colorMode === ("dark" as ColorMode) ? "seti" : "codemirror",
              }}
            />
          ) : (
            <EmptyView />
          )}
        </TabPanel>
        <TabPanel>
          {res.body ? (
            <Box textOverflow={"clip"} overflowWrap={"break-word"}>
              {JSON.stringify(res.body, null, 4)}
            </Box>
          ) : (
            <EmptyView />
          )}
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default DataPreview;
