import React from "react";
import { Box, Skeleton, useColorModeValue } from "@chakra-ui/react";
import { ColorMode } from "@chakra-ui/react";
import { TableStyles } from "react-data-table-component";

export const getCustomStyles = (colorMode: ColorMode): TableStyles => {
  const headerBg =
    colorMode == "light" ? "rgb(252, 252, 252)" : "rgb(17, 19, 23)";
  const headerTextColor =
    colorMode == "light" ? "rgb(163, 165, 170)" : "rgb(98, 100, 116)";
  const textColor = colorMode == "light" ? "black" : "white";
  const rowColor = colorMode == "light" ? "white" : "rgb(21, 23, 27)";
  const hoverRowColor =
    colorMode == "light" ? "rgb(252, 252, 252)" : "rgb(24, 26, 30)";
  return {
    rows: {
      style: {
        background: rowColor,
        color: textColor,
        minHeight: "64px",
        fontWeight: "500",
        "&:hover": {
          cursor: "pointer",
          background: hoverRowColor,
        },
      },
    },
    headRow: {
      style: {
        background: headerBg,
        color: headerTextColor,
      },
    },
    pagination: {
      style: {
        background: headerBg,
        color: textColor,
      },
      pageButtonsStyle: {
        color: textColor,
        fill: textColor,
        "&:disabled": {
          fill: textColor,
          color: textColor,
        },
      },
    },
  } as TableStyles;
};

export const SkeletonCell = React.memo(() => {
  const startColor = useColorModeValue("gray.50", "gray.700");
  const endColor = useColorModeValue("gray.200", "gray.800");
  return (
    <Box w="100%" h="10px">
      <Skeleton startColor={startColor} endColor={endColor} height="20px" />
    </Box>
  );
});

export const rowStyles = [
  {
    style: {
      backgroundColor: "rgba(63, 195, 128, 0.9)",
      color: "white",
      "&:hover": {
        cursor: "pointer",
      },
    },
  },
];
