import React from "react";

import { Request } from "@common/types";
import EmptyView from "../utils/EmptyView";

interface TestListProps {
  tests: Request[][];
}

const TestList: React.FC<TestListProps> = React.memo(({ tests }) => {
  if (tests.length == 0) {
    return <EmptyView />;
  }
  return null;
});

export default TestList;
