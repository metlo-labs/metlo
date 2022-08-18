import React from "react";
import NextLink from "next/link";
import { ApiEndpointDetailed } from "@common/types";
import EmptyView from "../utils/EmptyView";
import { Button, Heading, VStack } from "@chakra-ui/react";

interface TestListProps {
  endpoint: ApiEndpointDetailed;
}

const TestList: React.FC<TestListProps> = React.memo(({ endpoint }) => {
  if (endpoint.tests.length == 0) {
    return (
      <EmptyView>
        <VStack spacing="8">
          <Heading
            size="lg"
            fontWeight="semibold"
            textAlign="center"
            color="gray.400"
          >
            No Tests Yet!
          </Heading>
          <NextLink href={`/endpoint/${endpoint.uuid}/test/new`}>
            <Button size="lg" colorScheme="blue">
              Create a Test
            </Button>
          </NextLink>
        </VStack>
      </EmptyView>
    );
  }
  return null;
});

export default TestList;
