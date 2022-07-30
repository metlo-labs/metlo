import React from "react";
import { IconType } from "@react-icons/all-files/lib";
import { Grid, Heading, HStack, VStack } from "@chakra-ui/react";

export const SectionHeader: React.FC<{ text: string; sym: IconType }> =
  React.memo(({ text, sym }) => (
    <HStack>
      {sym({})}
      <Heading size="sm" fontWeight="semibold">
        {text}
      </Heading>
    </HStack>
  ));

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
