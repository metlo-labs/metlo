import React from "react"
import { Box, Skeleton, useColorModeValue } from "@chakra-ui/react"
import { ColorMode } from "@chakra-ui/react"
import { TableStyles } from "react-data-table-component"

export const getCustomStyles = (
  colorMode: ColorMode,
  subTable?: boolean,
  hover?: boolean,
): TableStyles => {
  hover = hover == undefined ? true : false
  const headerBg =
    colorMode == "light" ? "rgb(252, 252, 252)" : "rgb(17, 19, 23)"
  const headerTextColor =
    colorMode == "light" ? "rgb(163, 165, 170)" : "rgb(98, 100, 116)"
  const textColor =
    colorMode == "light" ? "var(--chakra-colors-gray-600)" : "white"
  const expandIconColor = colorMode == "light" ? "black" : "white"
  const rowColor = colorMode == "light" ? "white" : "rgb(21, 23, 27)"
  const rowColorSubtable =
    colorMode == "light" ? "rgb(250, 250, 250)" : "rgb(19, 22, 26)"
  const hoverRowColor =
    colorMode == "light" ? "rgb(252, 252, 252)" : "rgb(24, 26, 30)"
  const hoverRowColorSubtable =
    colorMode == "light" ? "rgb(242, 243, 244)" : "rgb(23, 32, 42)"
  return {
    rows: {
      style: {
        paddingTop: "10px",
        paddingBottom: "10px",
        background: subTable ? rowColorSubtable : rowColor,
        color: textColor,
        minHeight: "64px",
        fontWeight: "var(--chakra-fontWeights-medium)",
        fontSize: "var(--chakra-fontSizes-sm)",
        "&:hover": hover
          ? {
              cursor: "pointer",
              background: subTable ? hoverRowColorSubtable : hoverRowColor,
            }
          : undefined,
      },
    },
    headRow: {
      style: {
        fontWeight: "bold",
        fontSize: "var(--chakra-fontSizes-sm)",
        color: "var(--chakra-colors-gray-900)",
      },
    },
    expanderButton: {
      style: {
        color: expandIconColor,
      },
    },
    pagination: {
      style: {
        color: "black",
        borderBottomLeftRadius: "var(--chakra-radii-lg)",
        borderBottomRightRadius: "var(--chakra-radii-lg)",
      },
      pageButtonsStyle: {
        color: textColor,
        fill: textColor,
      },
    },
  } as TableStyles
}

export const SkeletonCell = React.memo(() => {
  const startColor = useColorModeValue("gray.50", "gray.700")
  const endColor = useColorModeValue("gray.200", "gray.800")
  return (
    <Box w="100%" h="10px">
      <Skeleton startColor={startColor} endColor={endColor} height="20px" />
    </Box>
  )
})

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
]
