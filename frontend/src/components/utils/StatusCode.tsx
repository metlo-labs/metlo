export const statusCodeToColor = (code: number) => {
  const startNum = `${code}`[0];
  if (startNum[0] == "2") {
    return "green";
  }
  if (startNum[0] == "4") {
    return "orange";
  }
  if (startNum[0] == "5") {
    return "red";
  }
  return "gray";
};
