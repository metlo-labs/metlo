import React, { useState } from "react";
import { HStack, VStack, StackProps, Button, Text } from "@chakra-ui/react";
import { IoMdTrash } from "@react-icons/all-files/io/IoMdTrash";
import { FiPlus } from "@react-icons/all-files/fi/FiPlus";
import { Request } from "@common/testing/types";
import { METHOD_TO_COLOR } from "~/constants";

interface RequestListProps extends StackProps {
  requests: Request[];
  selectedRequest: number;
  updateSelectedRequest: (e: number) => void;
  addNewRequest: () => void;
  deleteRequest: (e: number) => void;
}

interface RequestItemProps {
  request: Request;
  selectedRequest: number;
  idx: number;
  updateSelectedRequest: (e: number) => void;
  deleteRequest: (e: number) => void;
}

const RequestItem: React.FC<RequestItemProps> = React.memo(
  ({ request, selectedRequest, idx, updateSelectedRequest, deleteRequest }) => {
    const [hovered, setHover] = useState(false);
    let host = "----";
    let path = "----";
    try {
      const url = new URL(request.url);
      host = url.host;
      path = decodeURI(url.pathname);
    } catch (e) {}
    return (
      <HStack
        onClick={() => updateSelectedRequest(idx)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        w="full"
        justifyContent="space-between"
        cursor="pointer"
        bg={selectedRequest == idx ? "gray.100" : "unset"}
        _hover={{ bg: selectedRequest == idx ? "gray.100" : "gray.50" }}
        px="2"
        py="4"
      >
        <VStack alignItems="flex-start" spacing="1" overflow="hidden">
          <HStack spacing="0" w="full">
            <Text
              fontSize="xs"
              fontWeight="semibold"
              fontFamily="mono"
              w="10"
              color={METHOD_TO_COLOR[request.method] || "gray"}
            >
              {request.method.toUpperCase()}
            </Text>
            <Text
              fontSize="xs"
              fontWeight="medium"
              fontFamily="mono"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              {path}
            </Text>
          </HStack>
          <Text
            fontSize="xs"
            fontWeight="medium"
            fontFamily="mono"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            overflow="hidden"
            color="gray.500"
          >
            {host}
          </Text>
        </VStack>
        <Button
          hidden={!hovered}
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            deleteRequest(idx);
          }}
          color="red.200"
          _hover={{ color: "red.500" }}
          p="1"
        >
          <IoMdTrash color="inherit" />
        </Button>
      </HStack>
    );
  }
);

const RequestList: React.FC<RequestListProps> = React.memo(
  ({
    requests,
    selectedRequest,
    updateSelectedRequest,
    addNewRequest,
    deleteRequest,
    ...props
  }) => {
    return (
      <VStack
        {...props}
        overflow="hidden"
        minW={{ md: "xs" }}
        display={{ md: "inherit", base: "none" }}
      >
        <VStack w="full" alignItems="flex-start" spacing="0">
          {requests.map((e, i) => (
            <RequestItem
              key={i}
              request={e}
              selectedRequest={selectedRequest}
              idx={i}
              updateSelectedRequest={updateSelectedRequest}
              deleteRequest={deleteRequest}
            />
          ))}
        </VStack>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={addNewRequest}
        >
          Request
        </Button>
      </VStack>
    );
  }
);

export default RequestList;
