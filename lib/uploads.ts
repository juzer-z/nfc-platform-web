import crypto from "crypto";

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

function getCloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "1card-fyi";

  const values = [cloudName, apiKey, apiSecret];
  const hasAny = values.some(Boolean);
  const hasAll = values.every(Boolean);

  if (!hasAny) return null;

  if (!hasAll) {
    throw new Error(
      "Cloudinary is partially configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  return {
    cloudName: cloudName as string,
    apiKey: apiKey as string,
    apiSecret: apiSecret as string,
    folder,
  };
}

export function isCloudinaryConfigured() {
  return getCloudinaryConfig() !== null;
}

export async function uploadImageToStorage(params: {
  bytes: Buffer;
  mimeType: string;
  filename: string;
  type: "photo" | "logo";
}) {
  const config = getCloudinaryConfig();
  if (!config) return null;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `${config.folder}/${params.type}s`;
  const signaturePayload = `folder=${folder}&timestamp=${timestamp}${config.apiSecret}`;
  const signature = crypto
    .createHash("sha1")
    .update(signaturePayload)
    .digest("hex");

  const form = new FormData();
  form.append(
    "file",
    new Blob([params.bytes], { type: params.mimeType }),
    params.filename
  );
  form.append("api_key", config.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    {
      method: "POST",
      body: form,
    }
  );

  const data = (await response.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Cloud upload failed");
  }

  return data.secure_url;
}
