import {
  S3Client,
  DeleteObjectCommand,

} from "@aws-sdk/client-s3";
import { parseS3HttpUrl } from "../utils/utilis";

if (
  !process.env.S3_ACCESS_KEY ||
  !process.env.S3_SECRET ||
  !process.env.S3_LOCATION
) {
  throw new Error("Missing required S3 environment variables");
}

export const s3Client = new S3Client({
  region: process.env.S3_LOCATION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET,
  },
});

export const deleteFromS3 = async (s3Url: string) => {
  const { bucket, key } = parseS3HttpUrl(s3Url);

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    await s3Client.send(command);
    console.log("Deleted from S3:", key);
  } catch (error) {
    console.error("S3 Delete Error:", error);
    throw new Error("Failed to delete file from storage");
  }
};



