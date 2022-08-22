import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { ConnectionType } from "@common/enums";
import { ConnectionInfo } from "@common/types";
import React from "react";
import AWS_INFO from "./aws";

interface ConnectionSelectorInterface {
  connection?: ConnectionInfo;
  setConnectionUpdated: (udpatedConnection: ConnectionInfo) => void;
  isOpen: boolean;
  onClose: () => void;
}
const ConnectionSelector: React.FC<ConnectionSelectorInterface> = ({
  connection,
  setConnectionUpdated,
  isOpen,
  onClose,
}) => {
  const InnerPanelSelector = () => {
    if (connection.connectionType === ConnectionType.AWS) {
      return (
        <AWS_INFO
          connection={connection}
          setConnection={setConnectionUpdated}
        />
      );
    } else if (connection.connectionType === ConnectionType.GCP) {
      return <Box>Nothing yet for GCP</Box>;
    } else {
      return <Box>Invalid choice {connection.connectionType}</Box>;
    }
  };
  if (connection) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent maxW={"50%"}>
          <ModalHeader>Connection Info</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{InnerPanelSelector()}</ModalBody>
        </ModalContent>
      </Modal>
    );
  } else {
    return <></>;
  }
};
export default ConnectionSelector;
