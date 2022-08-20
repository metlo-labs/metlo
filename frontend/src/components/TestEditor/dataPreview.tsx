import {
  Box,
  HStack,
  useRadio,
  useRadioGroup,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import EmptyView from "../utils/EmptyView";
import dynamic from "next/dynamic";
import "codemirror/lib/codemirror.css";
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
  const theme = useColorModeValue("codemirror", "seti");
  const [selectedValue, setSelectedValue] = useState("Pretty");
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "preview-format",
    defaultValue: "Pretty",
    onChange: setSelectedValue,
  });
  const group = getRootProps();

  return (
    <VStack spacing="0">
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
      <Box w="full">
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
                theme,
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
  );
};

export default DataPreview;
