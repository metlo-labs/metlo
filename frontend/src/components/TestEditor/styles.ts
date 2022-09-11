import { StylesConfig } from "react-select"

export const getMethodSelectStyles = (
  methodMenuBG: string,
  methodTextColor: string,
  methodHighlightColor: string,
): StylesConfig => ({
  control: (provided, state) => ({
    ...provided,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: methodMenuBG,
    color: methodTextColor,
    borderWidth: "none",
    "&:focus-within": {
      borderColor: "unset",
      boxShadow: "unset",
    },
  }),
  singleValue: (provided, state) => ({
    ...provided,
    color: methodTextColor,
    fontWeight: "var(--chakra-fontWeights-semibold)",
    fontSize: "0.8rem",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? methodHighlightColor : methodMenuBG,
    color: methodTextColor,
    fontWeight: "var(--chakra-fontWeights-normal)",
    fontSize: "0.8rem",
    "&:hover": {
      backgroundColor: methodHighlightColor,
    },
  }),
  menu: (provided, state) => ({
    ...provided,
    backgroundColor: methodMenuBG,
  }),
  valueContainer: (provided, state) => ({
    ...provided,
    height: "38px",
    borderColor: "rgb(222, 228, 237)",
  }),
  container: (provided, state) => ({
    ...provided,
    borderColor: "rgb(222, 228, 237)",
  }),
})
