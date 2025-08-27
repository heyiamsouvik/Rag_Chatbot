import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file found" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "uploads/pdf", resource_type: "raw" },
          (error, res) => {
            if (error) reject(error);
            else resolve(res as UploadApiResponse);
          }
        )
        .end(buffer);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
