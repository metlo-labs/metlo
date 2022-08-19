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
  VStack,
} from "@chakra-ui/react";
import { SectionHeader } from "../utils/Card";
import EmptyView from "../utils/EmptyView";
import dynamic from "next/dynamic";

// CodeMirror default theme for light mode
import "codemirror/lib/codemirror.css";
// CodeMirror seti theme for dark mode
import "codemirror/theme/seti.css";
import { Result } from "@common/testing/types";
import { useState } from "react";

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

type variant = "left" | "center" | "right";

function RadioCard({ variant, ...props }) {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  const { colorMode } = useColorMode();

  return (
    <Box as="label" m={0} marginInlineStart={0}>
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderLeftRadius={variant == "left" ? "md" : "none"}
        borderRightRadius={variant == "right" ? "md" : "none"}
        boxShadow="md"
        _checked={{
          bg: colorMode === "dark" ? "whiteAlpha.300" : "blackAlpha.300",
          color: colorMode === "dark" ? "white" : "black",
          borderColor: "teal.600",
        }}
        _focus={{
          boxShadow: "none",
        }}
        py={0.5}
        px={1}
      >
        {props.children}
      </Box>
    </Box>
  );
}

const DataPreview: React.FC<DataPreviewInterface> = ({ res }) => {
  const { colorMode } = useColorMode();
  const options = ["Pretty", "Raw"];
  const [selectedValue, setSelectedValue] = useState("Pretty");
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "preview-format",
    defaultValue: "Pretty",
    onChange: setSelectedValue,
  });
  const group = getRootProps();

  return (
    <>
      <VStack p={2}>
        <HStack gap={0} spacing={0} {...group} marginInlineStart={0} w={"full"}>
          <RadioCard
            variant={"left"}
            key={"Pretty"}
            {...getRadioProps({ value: "Pretty" })}
          >
            Pretty
          </RadioCard>
          <RadioCard
            variant={"right"}
            key={"Raw"}
            {...getRadioProps({ value: "Raw" })}
          >
            Raw
          </RadioCard>
        </HStack>
        <Box w={"full"}>
          {selectedValue === "Pretty" ? (
            res.body ? (
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
            )
          ) : null}
          {selectedValue === "Raw" ? (
            res.body ? (
              <Box textOverflow={"clip"} overflowWrap={"break-word"} px={2}>
                {JSON.stringify(res.body, null, 4)}
              </Box>
            ) : (
              <EmptyView />
            )
          ) : null}
        </Box>
      </VStack>
    </>
  );
};

export default DataPreview;
