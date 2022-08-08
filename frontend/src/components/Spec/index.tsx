import React, { useRef, useState } from "react";
import NextLink from "next/link";
import {
  Heading,
  useColorModeValue,
  HStack,
  VStack,
  Text,
  InputGroup,
  Button,
  Box,
} from "@chakra-ui/react";
import darkTheme from "prism-react-renderer/themes/duotoneDark";
import lightTheme from "prism-react-renderer/themes/github";
import { OpenApiSpec } from "@common/types";
import { AiFillApi } from "@react-icons/all-files/ai/AiFillApi";
import Highlight, { defaultProps } from "prism-react-renderer";

interface SpecPageProps {
  spec: OpenApiSpec;
}

const SpecPage: React.FC<SpecPageProps> = React.memo(({ spec }) => {
  const theme = useColorModeValue(lightTheme, darkTheme);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fetching, setFetching] = useState<boolean>(false);
  const headerColor = useColorModeValue(
    "rgb(179, 181, 185)",
    "rgb(91, 94, 109)"
  );
  const handleClick = () => inputRef.current?.click();
  return (
    <VStack w="full" alignItems="flex-start" spacing="10">
      <HStack justifyContent="space-between" w="full" alignItems="flex-end">
        <VStack alignItems="flex-start" pt="6">
          <NextLink href="/specs">
            <HStack color={headerColor} spacing="1" cursor="pointer">
              <AiFillApi />
              <Text fontWeight="semibold">API Specs</Text>
            </HStack>
          </NextLink>
          <Heading>{spec.name}</Heading>
        </VStack>
        <Box marginLeft="auto">
          <InputGroup onClick={handleClick}>
            <input
              type="file"
              multiple={false}
              hidden
              ref={(e) => {
                inputRef.current = e;
              }}
            />
            <Button colorScheme="blue" isLoading={fetching}>
              Update Spec
            </Button>
          </InputGroup>
        </Box>
      </HStack>
      <Highlight
        {...defaultProps}
        theme={theme}
        code={spec.spec}
        language={spec.extension}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={className}
            style={{
              ...style,
              fontSize: "14px",
              padding: "8px",
              width: "100%",
              overflowX: "scroll",
              minHeight: "100%",
            }}
          >
            {tokens.map((line, i) => (
              <pre
                style={{
                  textAlign: "left",
                  margin: "1em 0",
                  padding: "0.5em",
                  overflow: "scroll",
                }}
                key={i}
                {...getLineProps({ line, key: i })}
              >
                <span
                  style={{
                    display: "table-cell",
                    textAlign: "right",
                    paddingRight: "1em",
                    userSelect: "none",
                    opacity: "0.5",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ display: "table-cell" }}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token, key })} />
                  ))}
                </span>
              </pre>
            ))}
          </pre>
        )}
      </Highlight>
    </VStack>
  );
});

export default SpecPage;
