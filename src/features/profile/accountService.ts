import { apiClient } from "@/api/client";

export interface SignInMethods {
  hasPassword: boolean;
  googleLinked: boolean;
}

export interface DeleteAccountPayload {
  password?: string;
  googleIdToken?: string;
}

// Same contract as sg-krashi-client's shared DeleteAccountSection:
// GET /customers/me tells us which confirmation to ask for, DELETE
// /customers/me (with a body) re-authenticates and deletes.
export const accountService = {
  getSignInMethods: async (): Promise<SignInMethods> => {
    const response = await apiClient.get<SignInMethods>("/customers/me");
    return response.data;
  },

  deleteAccount: async (payload: DeleteAccountPayload): Promise<void> => {
    await apiClient.delete("/customers/me", { data: payload });
  },
};
