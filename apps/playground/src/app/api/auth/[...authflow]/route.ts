import { authFlowHandler } from "@authflow/nextjs";
import { auth } from "@/lib/auth";

export const { GET, POST, PATCH, DELETE } = authFlowHandler(auth);
