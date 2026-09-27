import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { apiClient } from "@/api/client";
import type { Paginated } from "@/api/types";
import type { CropScan, CropScanSummary, PickedImage, SupportedCrop } from "./types";

const BASE_PATH = "/ai/crop-doctor";

export const cropDoctorService = {
  // Public — works identically for a Guest (no Authorization header sent,
  // since apiClient's request interceptor only attaches one if a token is
  // actually stored) and for an authenticated user.
  analyze: async (images: PickedImage[], declaredCrop: string, language: string): Promise<CropScan> => {
    const formData = new FormData();
    images.forEach((image) => {
      // React Native's FormData file-append shape — not a real Blob/File,
      // just {uri, name, type}, which the RN networking layer knows how to
      // stream from disk.
      formData.append("files", { uri: image.uri, name: image.name, type: image.type } as unknown as Blob);
    });
    formData.append("declaredCrop", declaredCrop);
    formData.append("language", language);

    const response = await apiClient.post<CropScan>(`${BASE_PATH}/analyze`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getSupportedCrops: async (): Promise<SupportedCrop[]> => {
    const response = await apiClient.get<SupportedCrop[]>(`${BASE_PATH}/supported-crops`);
    return response.data;
  },

  getScans: async (page: number, size = 12): Promise<Paginated<CropScanSummary>> => {
    const response = await apiClient.get<Paginated<CropScanSummary>>(`${BASE_PATH}/scans`, { params: { page, size } });
    return response.data;
  },

  getScanDetail: async (id: number): Promise<CropScan> => {
    const response = await apiClient.get<CropScan>(`${BASE_PATH}/scans/${id}`);
    return response.data;
  },

  deleteScan: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_PATH}/scans/${id}`);
  },

  // No browser download-link trick on native — fetch the PDF bytes
  // (authenticated, same as the web version), write them to a real file in
  // the app's cache directory, then hand off to the OS share sheet (which
  // lets the user save it, open it in a PDF viewer, or share it directly).
  downloadReport: async (id: number, fallbackFilename: string): Promise<void> => {
    const response = await apiClient.get<ArrayBuffer>(`${BASE_PATH}/scans/${id}/report`, {
      responseType: "arraybuffer",
    });

    const disposition = response.headers["content-disposition"] as string | undefined;
    const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] ?? fallbackFilename;

    const file = new FileSystem.File(FileSystem.Paths.cache, filename);
    if (file.exists) {
      file.delete();
    }
    file.create();
    file.write(new Uint8Array(response.data));

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType: "application/pdf" });
    }
  },
};
