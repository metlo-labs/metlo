import React from "react";
import { Text, VStack } from "@chakra-ui/react";
import { OpenApiSpec } from "@common/types";

interface SpecPageProps {
  spec: OpenApiSpec;
}

const SpecPage: React.FC<SpecPageProps> = React.memo(({ spec }) => {
  return (
    <VStack w="full">
      <Text>{JSON.stringify(spec)}</Text>
    </VStack>
  );
});

export default SpecPage;
