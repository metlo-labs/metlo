export const getMethodSelectStyles = (methodMenuBG: string) => ({
  control: (provided, state) => ({
    ...provided,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: methodMenuBG,
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
