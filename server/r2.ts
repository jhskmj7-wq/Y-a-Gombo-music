import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config({ override: true });

export type R2BucketType = "public" | "private";

export interface R2PresignedUploadParams {
  key: string;
  bucketType?: R2BucketType;
  contentType?: string;
  expiresInSeconds?: number;
}

export interface R2PresignedReadParams {
  key: string;
  bucketType?: R2BucketType;
  expiresInSeconds?: number;
}

export interface R2PresignedUploadResult {
  uploadUrl: string;
  key: string;
  bucket: string;
  bucketType: R2BucketType;
  publicUrl?: string;
  expiresInSeconds: number;
}

export interface R2PresignedReadResult {
  readUrl: string;
  key: string;
  bucket: string;
  bucketType: R2BucketType;
  expiresInSeconds: number;
}

let r2Client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!r2Client) {
    const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
    const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
    let rawEndpoint = (process.env.R2_ENDPOINT || "https://d336ac8939fd48099d0e284310a7deb5.r2.cloudflarestorage.com").trim();

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "Identifiants Cloudflare R2 manquants : R2_ACCESS_KEY_ID et R2_SECRET_ACCESS_KEY doivent être configurés dans l'environnement."
      );
    }

    // Normaliser l'endpoint Cloudflare R2 si le protocole est manquant
    if (rawEndpoint && !rawEndpoint.startsWith("http://") && !rawEndpoint.startsWith("https://")) {
      rawEndpoint = `https://${rawEndpoint}`;
    }

    r2Client = new S3Client({
      region: "auto",
      forcePathStyle: true,
      endpoint: rawEndpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return r2Client;
}

export function isR2Configured(): boolean {
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
  return Boolean(accessKeyId && secretAccessKey);
}

export function resolveR2Bucket(type: R2BucketType = "public"): string {
  if (type === "private") {
    return (process.env.R2_PRIVATE_BUCKET || "afrigombo-private").trim();
  }
  return (process.env.R2_PUBLIC_BUCKET || "afrigombo-public").trim();
}

export function getR2Config() {
  return {
    endpoint: process.env.R2_ENDPOINT || "https://d336ac8939fd48099d0e284310a7deb5.r2.cloudflarestorage.com",
    publicBucket: resolveR2Bucket("public"),
    privateBucket: resolveR2Bucket("private"),
    isConfigured: isR2Configured(),
  };
}

export async function generateR2PresignedUploadUrl(
  params: R2PresignedUploadParams
): Promise<R2PresignedUploadResult> {
  const {
    key,
    bucketType = "public",
    contentType = "application/octet-stream",
    expiresInSeconds = 3600,
  } = params;

  const client = getR2Client();
  const bucket = resolveR2Bucket(bucketType);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || "").trim();
  const publicUrl = publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, "")}/${key}` : undefined;

  return {
    uploadUrl,
    key,
    bucket,
    bucketType,
    publicUrl,
    expiresInSeconds,
  };
}

export async function generateR2PresignedReadUrl(
  params: R2PresignedReadParams
): Promise<R2PresignedReadResult> {
  const {
    key,
    bucketType = "private",
    expiresInSeconds = 3600,
  } = params;

  const client = getR2Client();
  const bucket = resolveR2Bucket(bucketType);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const readUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return {
    readUrl,
    key,
    bucket,
    bucketType,
    expiresInSeconds,
  };
}

export interface R2BucketTestResult {
  bucket: string;
  bucketType: R2BucketType;
  accessible: boolean;
  error?: string;
}

export async function uploadBufferToR2(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
  bucketType?: R2BucketType;
}): Promise<{ key: string; bucket: string; publicUrl?: string }> {
  const { key, buffer, contentType, bucketType = "public" } = params;
  const client = getR2Client();
  const bucket = resolveR2Bucket(bucketType);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || "").trim();
  const publicUrl = publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, "")}/${key}` : undefined;

  return { key, bucket, publicUrl };
}

export async function testR2BucketConnection(bucketType: R2BucketType): Promise<R2BucketTestResult> {
  const bucket = resolveR2Bucket(bucketType);
  try {
    const client = getR2Client();
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
    return {
      bucket,
      bucketType,
      accessible: true,
    };
  } catch (err: any) {
    return {
      bucket,
      bucketType,
      accessible: false,
      error: err?.message || String(err),
    };
  }
}

export async function deleteObjectFromR2(key: string, bucketType: R2BucketType = "public"): Promise<boolean> {
  if (!key) return false;
  try {
    const client = getR2Client();
    const bucket = resolveR2Bucket(bucketType);
    await client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }));
    return true;
  } catch (err) {
    console.warn(`[R2 Delete] Échec de la suppression de l'objet R2 ${key}:`, err);
    return false;
  }
}


