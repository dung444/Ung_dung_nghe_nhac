import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

export interface PickedMedia {
  uri: string;
  name: string;
  type: string;
  file?: File;
  size?: number;
  dataUrl?: string;
}

export async function pickImageFromDevice(): Promise<PickedMedia | null> {
  if (Platform.OS !== "web") {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Cần cấp quyền truy cập thư viện ảnh để tiếp tục.");
      return null;
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName || `image_${Date.now()}.jpg`,
    type: asset.mimeType || "image/jpeg",
    file: asset.file,
    size: asset.fileSize,
    dataUrl: asset.base64 ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}` : undefined,
  };
}

export async function pickAudioFileFromDevice(): Promise<PickedMedia | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["audio/mpeg", "audio/wav", "audio/flac", "audio/*"],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType || "audio/mpeg",
    file: asset.file,
    size: asset.size,
  };
}
