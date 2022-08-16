import React from "react";
import {
  HStack,
  VStack,
  StackProps,
  Button,
  Badge,
  Code,
} from "@chakra-ui/react";
import { FiPlus } from "@react-icons/all-files/fi/FiPlus";
import { Request } from "@common/testing/types";
import { METHOD_TO_COLOR } from "~/constants";

interface RequestListProps extends StackProps {
  requests: Request[];
  selectedRequest: number;
  updateSelectedRequest: (e: number) => void;
}

const RequestList: React.FC<RequestListProps> = React.memo(
  ({ requests, selectedRequest, updateSelectedRequest, ...props }) => {
    return (
      <VStack {...props} spacing="6">
        <VStack w="full" alignItems="flex-start">
          {requests.map((e, i) => (
            <HStack
              onClick={(e) => updateSelectedRequest(i)}
              key={i}
              spacing="1"
              w="full"
              cursor="pointer"
            >
              <Badge
                px="2"
                py="1"
                fontSize="sm"
                colorScheme={METHOD_TO_COLOR[e.method] || "gray"}
              >
                {e.method.toUpperCase()}
              </Badge>
              <Code fontSize="sm" fontWeight="semibold" p="1">
                {e.url}
              </Code>
            </HStack>
          ))}
        </VStack>
        <Button leftIcon={<FiPlus />} colorScheme="blue">
          Request
        </Button>
      </VStack>
    );
  }
);

export default RequestList;
