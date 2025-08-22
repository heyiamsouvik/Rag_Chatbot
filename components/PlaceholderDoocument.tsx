"use client";

import { PlusCircleIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

function PlaceholderDoocument() {

  const router = useRouter();


  const handelClick =  () => {
    // check if pro 
    router.push("/dashboard/upload");

  };
  return (
    <Button
      onClick={handelClick}
      className="mb-5 flex flex-col items-center justify-center w-64 h-75 rounded-xl bg-gray-200 drop-shadow-md text-gray-400"
    >
      <PlusCircleIcon className="h-16 w-16" />
      <p>Add a documemnt</p>
    </Button>
  );
}

export default PlaceholderDoocument;
