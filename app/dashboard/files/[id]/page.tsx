import Chat from "@/components/Chat";
import PdfView from "@/components/PdfView";
import { adminDb } from "@/firebaseAdmin";
import { auth } from "@clerk/nextjs/server";

async function ChatToFilePage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const { id } = await params;
  auth.protect();
  const { userId } = await auth();
  const ref = await adminDb
    .collection("users")
    .doc(userId!)
    .collection("files")
    .doc(id)
    .get();

  const fileData = ref.data();

  if (!fileData || !fileData.cloudinaryUrl) {
    return <div>File not found</div>;
  }

  const url = fileData.cloudinaryUrl;

  return (
    <div className="grid lg:grid-cols-5 h-full overflow-hidden">
      <div className="col-span-5 lg:col-span-2 overflow-y-auto ">

         <Chat id={id}/>
        
      </div>
      <div className="col-span-5 lg:col-span-3 bg-gray-100 border-r-2 lg:border-indigo-600 lg:-order-1 overflow-y-auto">
       
        <PdfView url={url} />
      </div>

    </div>
  );
}

export default ChatToFilePage;
