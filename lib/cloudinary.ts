import { v2 as cloudinary } from "cloudinary";

export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

export async function uploadBase64Image(
  base64: string,
  folder = "glamora/beauty-ai"
): Promise<string> {
  configureCloudinary();
  const dataUri = base64.startsWith("data:")
    ? base64
    : `data:image/jpeg;base64,${base64}`;
  const result = await cloudinary.uploader.upload(dataUri, { folder });
  return result.secure_url;
}
