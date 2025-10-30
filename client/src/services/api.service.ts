import axios from "axios";

console.log("API SERVICE");

const API_BASE = import.meta.env.DEV ? "http://localhost:10000/api" : "/api";

export const exampleRequest = async () => {
  const response = await axios.get(API_BASE + "/hello");
  return response.data.message;
};
