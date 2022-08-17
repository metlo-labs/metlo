import React from "react";
import { DataPair } from "@common/testing/types";
import { IoMdTrash } from "@react-icons/all-files/io/IoMdTrash";
import { HiPlus } from "@react-icons/all-files/hi/HiPlus";
import {
  Button,
  Heading,
  HStack,
  StackDivider,
  StackProps,
  VStack,
  Input,
} from "@chakra-ui/react";

interface DataPairEditorProps extends StackProps {
  title: string;
  pairs: DataPair[];
  updatePairs: (t: (e: DataPair[]) => DataPair[]) => void;
}

interface DataPairTableProps {
  pairs: DataPair[];
  updatePairs: (t: (e: DataPair[]) => DataPair[]) => void;
}

const DataPairTable: React.FC<DataPairTableProps> = React.memo(
  ({ pairs, updatePairs }) => {
    const onDelete = (idx: number) => {
      updatePairs((pairs) => pairs.filter((e, i) => i != idx));
    };
    const onUpdateKey = (idx: number, value: string) => {
      updatePairs((pairs) => {
        let newPairs = [...pairs];
        newPairs[idx].key = value;
        return newPairs;
      });
    };
    const onUpdateValue = (idx: number, value: string) => {
      updatePairs((pairs) => {
        let newPairs = [...pairs];
        newPairs[idx].value = value;
        return newPairs;
      });
    };
    return (
      <VStack
        w="full"
        divider={<StackDivider />}
        spacing="0"
        borderBottom="1px"
        borderColor="gray.200"
      >
        {pairs.map((e, i) => (
          <HStack key={i} spacing="0" w="full" divider={<StackDivider />}>
            <Input
              rounded="none"
              border="none"
              flexGrow="1"
              placeholder={`Key ${i + 1}`}
              defaultValue={e.key}
              onBlur={(evt) => onUpdateKey(i, evt.target.value)}
              fontWeight="medium"
              fontSize="sm"
            />
            <Input
              rounded="none"
              border="none"
              flexGrow="1"
              placeholder={`Value ${i + 1}`}
              defaultValue={e.value}
              onBlur={(evt) => onUpdateValue(i, evt.target.value)}
              fontWeight="medium"
              fontSize="sm"
            />
            <Button size="md" variant="ghost" rounded="none">
              <IoMdTrash size="35" onClick={() => onDelete(i)} />
            </Button>
          </HStack>
        ))}
      </VStack>
    );
  }
);

const DataPairEditor: React.FC<DataPairEditorProps> = React.memo(
  ({ title, pairs, updatePairs, ...props }) => {
    const addNew = () => {
      updatePairs((e) => e.concat({ key: "", value: "" }));
    };
    const clearAll = () => {
      updatePairs((e) => []);
    };

    return (
      <VStack w="full" alignItems="flex-start" h="full" spacing="0" {...props}>
        <HStack
          w="full"
          justifyContent="space-between"
          borderBottom="1px"
          borderColor="gray.200"
        >
          <Heading size="xs" fontWeight="semibold" color="gray.500" px="4">
            {title}
          </Heading>
          <HStack pr="6" color="gray.500">
            <Button size="sm" variant="ghost" onClick={addNew}>
              <HiPlus />
            </Button>
            <Button size="sm" variant="ghost" onClick={clearAll}>
              <IoMdTrash />
            </Button>
          </HStack>
        </HStack>
        {pairs.length == 0 ? (
          <VStack flexGrow="1" w="full" py="10" spacing="6" bg="secondaryBG">
            <Heading size="sm" color="gray.500">
              This request does not have any {title.toLowerCase()}...
            </Heading>
            <Button colorScheme="blue" leftIcon={<HiPlus />} onClick={addNew}>
              Add new
            </Button>
          </VStack>
        ) : null}
        {pairs.length > 0 ? (
          <DataPairTable pairs={pairs} updatePairs={updatePairs} />
        ) : null}
      </VStack>
    );
  }
);

export default DataPairEditor;
