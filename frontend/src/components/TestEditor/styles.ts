export const getMethodSelectStyles = (
  methodMenuBG: string,
  methodTextColor: string,
  methodHighlightColor: string
) => ({
  control: (provided, state) => ({
    ...provided,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: methodMenuBG,
    color: methodTextColor,
  }),
  singleValue: (provided, state) => ({
    ...provided,
    color: methodTextColor,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? methodHighlightColor : methodMenuBG,
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
});
