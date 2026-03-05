import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

export function getS3ImageKey(cardId: string): string {
  return `cards/${cardId}.jpg`;
}

export function getS3ImageUrl(cardId: string): string {
  const region = process.env.AWS_REGION ?? "us-east-1";
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${getS3ImageKey(cardId)}`;
}

export async function imageExistsOnS3(cardId: string): Promise<boolean> {
  try {
    await s3.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: getS3ImageKey(cardId) })
    );
    return true;
  } catch {
    return false;
  }
}

export async function uploadImageToS3(
  cardId: string,
  imageUrl: string
): Promise<string> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const key = getS3ImageKey(cardId);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return getS3ImageUrl(cardId);
}
