import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  GridItem,
  Text,
  VStack,
  Code,
  Badge,
  HStack,
  Checkbox,
  useToast,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import { DataField } from "@common/types";
import {
  RISK_TO_COLOR,
  DATA_CLASS_TO_RISK_SCORE,
  TAG_TO_COLOR,
} from "~/constants";
import { getDateTimeString } from "utils";
import { updateDataField } from "api/dataFields";

interface DataFieldDetailProps {
  dataField: DataField;
  dataFieldList: DataField[];
  setdataFieldList: React.Dispatch<React.SetStateAction<DataField[]>>;
}

const DataFieldDetail: React.FC<DataFieldDetailProps> = React.memo(
  ({ dataField, dataFieldList, setdataFieldList }) => {
    const [currDataField, setCurrDataField] = useState<DataField>(dataField);
    const [updating, setUpdating] = useState<boolean>(false);
    const toast = useToast();

    useEffect(() => {
      setCurrDataField(dataField);
    }, [dataField]);

    const handleUpdateClick = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      setUpdating(true);
      const resp: DataField = await updateDataField(currDataField.uuid, {
        isRisk: !e.target.checked,
      });
      if (resp) {
        toast({
          title: "Successfully Updated Data Field!",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
        const tempFieldList = [...dataFieldList];
        for (let i = 0; i < tempFieldList.length; i++) {
          if (tempFieldList[i].uuid === resp.uuid) {
            tempFieldList[i] = resp;
          }
        }
        setCurrDataField(resp);
        setdataFieldList([...tempFieldList]);
      } else {
        toast({
          title: "Updating Data Field Failed...",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
      }
      setUpdating(false);
    };

    return (
      <Box h="full" overflowY="auto" p="4">
        <Grid templateColumns="1fr 1fr" gap="4">
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Field</Text>
              {currDataField.dataPath ? (
                <Code p="1" rounded="md" fontSize="sm">
                  {currDataField.dataPath}
                </Code>
              ) : (
                <Text>None</Text>
              )}
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Risk Score</Text>
              <Badge
                p="1"
                fontSize="sm"
                colorScheme={
                  RISK_TO_COLOR[
                    DATA_CLASS_TO_RISK_SCORE[currDataField.dataClass ?? ""]
                  ]
                }
                pointerEvents="none"
              >
                {DATA_CLASS_TO_RISK_SCORE[currDataField.dataClass ?? ""]}
              </Badge>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Data Type</Text>
              <Code p="1" rounded="md" fontSize="sm">
                {currDataField.dataType || "N/A"}
              </Code>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Date Identified</Text>
              <Code p="1" rounded="md" fontSize="sm">
                {getDateTimeString(currDataField.createdAt)}
              </Code>
            </VStack>
          </GridItem>
          {currDataField.dataClass && (
            <GridItem>
              <VStack alignItems="flex-start">
                <Text fontWeight="semibold">Sensitive Data Class</Text>
                <Code p="1" rounded="md" fontSize="sm">
                  {currDataField.dataClass}
                </Code>
              </VStack>
            </GridItem>
          )}
          {currDataField.dataTag && (
            <GridItem>
              <VStack alignItems="flex-start">
                <Text fontWeight="semibold">Tag</Text>
                <Badge
                  py="1"
                  px="2"
                  fontSize="sm"
                  colorScheme={TAG_TO_COLOR[currDataField.dataTag]}
                >
                  {currDataField.dataTag}
                </Badge>
              </VStack>
            </GridItem>
          )}
        </Grid>
        <VStack w="full" pt="4" spacing="4">
          {currDataField.matches?.length > 0 && (
            <VStack w="full" alignItems="flex-start">
              <Text fontWeight="semibold">Example Matches</Text>
              <Code p="1" w="full" rounded="md" fontSize="sm">
                <UnorderedList px="3">
                  {currDataField.matches.map((match, idx) => (
                    <ListItem key={idx}>{match}</ListItem>
                  ))}
                </UnorderedList>
              </Code>
            </VStack>
          )}
          {currDataField.dataClass && (
            <HStack w="full" spacing="5">
              <Checkbox
                isChecked={!currDataField.isRisk}
                onChange={handleUpdateClick}
                size="lg"
                colorScheme="green"
              >
                Fake
              </Checkbox>
            </HStack>
          )}
        </VStack>
      </Box>
    );
  }
);

export default DataFieldDetail;
