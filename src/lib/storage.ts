import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(file: File): Promise<string> {
  const key = `pdfs/${Date.now()}-${file.name}`;
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: await file.arrayBuffer(),
    ContentType: file.type,
  });

  await s3Client.send(command);
  
  // Generate a signed URL for future access
  const getCommand = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  console.log('File uploaded to R2:', key);
  
  const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 24 * 3600 }); 
  return signedUrl;
}