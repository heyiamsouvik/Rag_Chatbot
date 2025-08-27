"use client";

import { useUser } from "@clerk/nextjs";
import { setDoc, doc } from "firebase/firestore";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/firebase";
import axios from "axios";
import { generateEmbeddings } from "@/actions/generateEmbeddings";

export enum StatusText {
  IDLE = "Idle",
  UPLOADING = "Uploading file ...",
  UPLOADED = "File uploaded successfully",
  SAVING = "Saving metadata to Firestore ...",
  GENERATING = "Generating AI Embeddings ...",
}

export type Status = (typeof StatusText)[keyof typeof StatusText];

function useUpload() {
  const [progress, setProgress] = useState<number | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(StatusText.IDLE);
  const [url, setUrl] = useState<string | null>(null);
  const { user } = useUser();

  const handleUpload = async (file: File) => {
    if (!file || !user) return;

    setStatus(StatusText.UPLOADING);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 🔹 Use axios with progress tracking
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) {
            const percent = Math.round((event.loaded * 100) / event.total);
            setProgress(percent);
          }
        },
      });

      const data = res.data;

      if (!data.secure_url) {
        throw new Error("Upload failed");
      }

      setStatus(StatusText.UPLOADED);
      setUrl(data.secure_url);

      // 🔹 Save metadata in Firestore
      setStatus(StatusText.SAVING);

      const fileId = uuidv4();
      await setDoc(doc(db, "users", user.id, "files", fileId), {
        name: file.name,
        size: file.size,
        type: file.type,
        cloudinaryUrl: data.secure_url,
        publicId: data.public_id,
        createdAt: new Date(),
      });

      setStatus(StatusText.GENERATING);
      try {
        await generateEmbeddings(fileId);
      } catch (embeddingErr) {
        console.error("Embedding generation failed", embeddingErr);
        setStatus(StatusText.IDLE);
        return;
      }

      setFileId(fileId);
    } catch (err) {
      console.error("Upload failed", err);
      setStatus(StatusText.IDLE);
      setProgress(null);
    }
  };

  return { progress, status, fileId, url, handleUpload };
}

export default useUpload;
