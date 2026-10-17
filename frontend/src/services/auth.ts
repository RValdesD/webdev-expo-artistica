import axios from "axios";
import type { Client, LoginInput, SignupInput } from "../types/auth";

export const writeOptions = { headers: { "X-Expo-Request": "1" } };

const me = () =>
  axios
    .get<{ client: Client | null }>("/api/auth/me")
    .then((response) => response.data.client);
const signup = (input: SignupInput) =>
  axios.post("/api/auth/signup", input, writeOptions).then(() => undefined);
const login = (input: LoginInput) =>
  axios
    .post<{ client: Client }>("/api/auth/login", input, writeOptions)
    .then((response) => response.data.client);
const logout = () =>
  axios.post("/api/auth/logout", {}, writeOptions).then(() => undefined);

export function apiError(error: unknown): string {
  if (
    axios.isAxiosError<{ error?: string }>(error) &&
    typeof error.response?.data.error === "string"
  ) {
    return error.response.data.error;
  }
  return "No pudimos completar la solicitud. Comprueba la conexión e inténtalo nuevamente.";
}

export default { me, signup, login, logout };
