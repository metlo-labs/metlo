import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  GridItem,
  Text,
  VStack,
  Code,
  Badge,
  useToast,
} from "@chakra-ui/react";
import { DataField } from "@common/types";
import {
  RISK_TO_COLOR,
  TAG_TO_COLOR,
} from "~/constants";
import {
  getDateTimeString,
  getMaxRiskScoreFromList,
  getRiskScores,
} from "utils";
import { ignoreDataClass } from "api/dataFields";
import { DataClass, RiskScore } from "@common/enums";
import { DataClassComponent } from "./DataClass";
import EmptyView from "components/utils/EmptyView";

interface DataFieldDetailProps {
  dataField: DataField;
  dataFieldList: DataField[];
  setdataFieldList: React.Dispatch<React.SetStateAction<DataField[]>>;
}

const DataFieldDetail: React.FC<DataFieldDetailProps> = React.memo(
  ({ dataField, dataFieldList, setdataFieldList }) => {
    const [currDataField, setCurrDataField] = useState<DataField>(dataField);
    const [updating, setUpdating] = useState<boolean>(false);
    const [riskScore, setRiskScore] = useState<RiskScore>();
    const toast = useToast();

    useEffect(() => {
      setCurrDataField(dataField);
    }, [dataField]);

    useEffect(() => {
      setRiskScore(
        getMaxRiskScoreFromList(getRiskScores(currDataField.dataClasses))
      );
    }, [currDataField]);

    const handleIgnoreClick = async (ignoredDataClass: DataClass) => {
      setUpdating(true);
      const resp: DataField = await ignoreDataClass(currDataField.uuid, {
        dataClass: ignoredDataClass,
        dataPath: currDataField.dataPath,
        dataSection: currDataField.dataSection,
      });
      if (resp) {
        toast({
          title: `Ignored Data Class ${ignoredDataClass}`,
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
          title: `Ignoring Data Class ${ignoredDataClass} failed...`,
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
                colorScheme={RISK_TO_COLOR[riskScore]}
                pointerEvents="none"
              >
                {riskScore}
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
          <Text w="full" fontWeight="semibold">
            Sensitive Data Classes
          </Text>
          {currDataField.dataClasses?.length > 0 ? (
            currDataField.dataClasses.map((dataClass) => (
              <DataClassComponent
                key={dataClass}
                dataClass={dataClass}
                matches={currDataField.matches[dataClass]}
                handleIgnoreClick={handleIgnoreClick}
                updating={updating}
              />
            ))
          ) : (
            <EmptyView text="No sensitive data detected." />
          )}
        </VStack>
      </Box>
    );
  }
);

export default DataFieldDetail;
