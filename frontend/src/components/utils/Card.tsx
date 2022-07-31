import React from "react";
import { IconType } from "@react-icons/all-files/lib";
import {
  Grid,
  Heading,
  HStack,
  Text,
  TextProps,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";

type DataHeadingProps = TextProps;

export const DataHeading: React.FC<DataHeadingProps> = React.memo(
  ({ children, ...props }) => {
    const color = useColorModeValue("rgb(102, 105, 117)", "rgb(116, 120, 138)");
    return (
      <Text fontSize="md" fontWeight="medium" color={color} pb="2" {...props}>
        {children}
      </Text>
    );
  }
);

type DataAttributeProps = TextProps;

export const DataAttribute: React.FC<DataAttributeProps> = React.memo(
  ({ children, ...props }) => {
    const color = useColorModeValue("black", "white");
    return (
      <Text fontWeight="bold" color={color} overflowWrap="anywhere" {...props}>
        {children}
      </Text>
    );
  }
);

export const SectionHeader: React.FC<{
  text: string;
  sym: IconType;
}> = React.memo(({ text, sym }) => {
  return (
    <HStack justifyContent="center">
      {sym({})}
      <Heading size="sm" fontWeight="semibold">
        {text}
      </Heading>
    </HStack>
  );
});

export const Card: React.FC<{ children: React.ReactNode }> = React.memo(
  ({ children }) => {
    return (
      <Grid
        templateColumns="repeat(2, 1fr)"
        gap={4}
        w="full"
        borderWidth="2px"
        p="4"
        rounded="md"
      >
        {children}
      </Grid>
    );
  }
);

export const CardWithHeader: React.FC<{
  title: string;
  sym: IconType;
  children: React.ReactNode;
}> = React.memo(({ title, sym, children }) => {
  return (
    <VStack w="full" alignItems="flex-start">
      <SectionHeader text={title} sym={sym} />
      <Card>{children}</Card>
    </VStack>
  );
});
