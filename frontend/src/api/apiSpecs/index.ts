import axios from "axios";
import { OpenApiSpec } from "@common/types";
import { getAPIURL } from "../../constants";

export const getSpecs = async () => {
  try {
    const resp = await axios.get<[OpenApiSpec[], number]>(`${getAPIURL()}/specs`);
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
  return await axios.post(`${getAPIURL()}/spec/new`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateSpec = async (name: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return await axios.put(`${getAPIURL()}/spec/${name}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getSpec = async (name: string) => {
  const resp = await axios.get<OpenApiSpec>(`${getAPIURL()}/spec/${name}`);
  return resp.data;
};
