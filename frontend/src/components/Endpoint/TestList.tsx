import React from "react";
import NextLink from "next/link";
import { ApiEndpointDetailed } from "@common/types";
import EmptyView from "../utils/EmptyView";
import { Box, Button, Heading, VStack } from "@chakra-ui/react";
import ListTests from "../TestList";
import { TestDetailed } from "@common/testing/types";

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
  return (
    <Box px={2} pt={4}>
      <ListTests
        tests={endpoint.tests.map((test, i) => {
          return { ...test, apiEndpoint: endpoint } as TestDetailed;
        })}
      />
    </Box>
  );
});

export default TestList;
