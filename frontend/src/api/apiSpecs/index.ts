import axios from "axios";
import { OpenApiSpec } from "@common/types";
import { API_URL } from "../../constants";

export const getSpecs = async () => {
  try {
    const resp = await axios.get<[OpenApiSpec[], number]>(
      `${API_URL}/specs`
    );
    if (resp.status === 200 && resp.data) {
      return resp.data;
    }
    return [];
  } catch (err) {
    console.error(`Error fetching endpoints: ${err}`);
    return [];
  }
};

export const uploadSpec = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return await axios.post(`${API_URL}/spec/new`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
