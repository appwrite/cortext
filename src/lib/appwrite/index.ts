import { Client, Account } from "appwrite";
import { queryClient } from "../react-query";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;

if (!endpoint) {
  throw new Error("VITE_APPWRITE_ENDPOINT is not set");
}

const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!projectId) {
  throw new Error("VITE_APPWRITE_PROJECT_ID is not set");
}


const getAppwriteClient = () => {
  const appwriteClient = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

  patchAppwriteClientWithPreviewToken(appwriteClient);
  return appwriteClient;
}

const getAccountClient = () => {
  const appwriteClient = getAppwriteClient();
  return new Account(appwriteClient);
}

export {
  getAppwriteClient,
  getAccountClient,
};


const getPreviewTokenFromUrl = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const previewToken = searchParams.get("imaginePreviewToken");

  if (previewToken) {
    localStorage.setItem("imaginePreviewToken", previewToken);
  }

  return previewToken;
}


const patchAppwriteClientWithPreviewToken = (appwriteClient: Client) => {
  const previewTokenInLocalStorage = localStorage.getItem("imaginePreviewToken");
  const previewTokenInUrl = getPreviewTokenFromUrl();

  const token = previewTokenInLocalStorage || previewTokenInUrl;

  if (token) {
    appwriteClient.setJWT(token);
    queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
  }

  return appwriteClient;
}