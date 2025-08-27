"use client";

import React, { useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  CheckCircleIcon,
  CircleArrowDown,
  Divide,
  HammerIcon,
  RocketIcon,
  SaveIcon,
} from "lucide-react";
import useUpload from "@/hooks/useUpload";
import { useRouter } from "next/navigation";

function FileUploader() {
  const { progress, status, fileId, handleUpload } = useUpload();

  const router = useRouter();

  useEffect(() => {
    if (fileId) {
      router.push(`/dashboard/files/${fileId}`);
    }
  }, [fileId, router]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        await handleUpload(file);
      } else {
        // toast
      }
    },
    [handleUpload]
  );

  const { getRootProps, getInputProps, isDragActive, isFocused, isDragAccept } =
    useDropzone({
      onDrop,
      maxFiles: 1,
      accept: {
        "application/pdf": [".pdf"],
      },
    });

  const uploadInprogress = progress != null && progress >= 0 && progress <= 100;

  return (
    <div className="flex flex-col gap-4 items-center max-w-7xl mx-auto ">
      {uploadInprogress && (
        <div className="w-full max-w-lg mt-10">
          <p className="mb-2 text-indigo-600 font-medium">{status}</p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">{progress}%</p>
        </div>
      )}

      {!uploadInprogress && (
        <div
          {...getRootProps()}
          className={`p-10 mt-10 w-[90%] border-indigo-600 text-indigo-600 border-2 border-dashed rounded-lg h-96 flex items-center justify-center ${
            isFocused || isDragAccept ? "bg-indigo-300" : "bg-indigo-100"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center">
            {isDragActive ? (
              <>
                <RocketIcon className="h-20 w-20 animate-ping" />
                <p>Drop the files here ...</p>
              </>
            ) : (
              <>
                <CircleArrowDown className="h-20 w-20 animate-bounce" />
                <p>Drag n drop some files here, or click to select files</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
