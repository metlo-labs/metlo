import {
  Box,
  HStack,
  useRadio,
  useRadioGroup,
  VStack,
  useColorModeValue,
  Code,
} from "@chakra-ui/react";
import { Result } from "@common/testing/types";
import { useState } from "react";
import Editor from "@monaco-editor/react";

interface DataPreviewInterface {
  res: Result;
}

function RadioCard({ variant, ...props }) {
  const { getInputProps, getCheckboxProps } = useRadio(props);
  const input = getInputProps();
  const checkbox = getCheckboxProps();
  const bg = useColorModeValue("gray.100", "gray.800");
  const textColor = useColorModeValue("gray.500", "gray.500");
  const selectedTextColor = useColorModeValue("black", "white");

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        fontSize="sm"
        borderLeftRadius={variant == "left" ? "md" : "none"}
        borderRightRadius={variant == "right" ? "md" : "none"}
        bg={bg}
        color={textColor}
        _checked={{
          color: selectedTextColor,
        }}
        fontWeight="medium"
        py="2"
        px="4"
      >
        {props.children}
      </Box>
    </Box>
  );
}

const DataPreview: React.FC<DataPreviewInterface> = ({ res }) => {
  const theme = useColorModeValue("light", "vs-dark");
  const [selectedValue, setSelectedValue] = useState("Pretty");
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "preview-format",
    defaultValue: "Pretty",
    onChange: setSelectedValue,
  });
  const group = getRootProps();

  if (!res.body) {
    return null;
  }

  return (
    <VStack spacing="0" h="full" w="full">
      <HStack spacing="0" p="2" {...group} w="full">
        <RadioCard
          variant="left"
          key="Pretty"
          {...getRadioProps({ value: "Pretty" })}
        >
          Pretty
        </RadioCard>
        <RadioCard
          variant="right"
          key="Raw"
          {...getRadioProps({ value: "Raw" })}
        >
          Raw
        </RadioCard>
      </HStack>
      <Box w="full" flexGrow="1" overflow="hidden">
        {selectedValue === "Pretty" ? (
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="json"
            value={res.body}
            options={{
              minimap: {
                enabled: false,
              },
              automaticLayout: true,
              readOnly: true,
              theme,
            }}
          />
        ) : null}
        {selectedValue === "Raw" ? (
          <Code h="full" w="full" overflow="scroll">
            <pre>{res.body}</pre>
          </Code>
        ) : null}
      </Box>
    </VStack>
  );
};

export default DataPreview;
