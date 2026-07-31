import { bolkAuthHandler } from "@bolkauth/nextjs";
import { auth } from "@/lib/auth";

export const { GET, POST, PATCH, DELETE } = bolkAuthHandler(auth);
