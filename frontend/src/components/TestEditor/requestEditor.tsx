import React from "react";
import { VStack, StackProps } from "@chakra-ui/react";
import { Request } from "@common/testing/types";

interface RequestEditorProps extends StackProps {
  request: Request;
}

const RequestEditor: React.FC<RequestEditorProps> = React.memo(
  ({ request, ...props }) => {
    return <VStack {...props}></VStack>;
  }
);

export default RequestEditor;
