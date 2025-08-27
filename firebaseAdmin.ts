import  { initializeApp, getApps, App, getApp, cert,ServiceAccount } from "firebase-admin/app";

import { getFirestore } from "firebase-admin/firestore";

// const serviceKey = require("@/service_key.json");
import serviceKey from "@/service_key.json";



let app: App;

if(getApps().length === 0){
    app = initializeApp({
        credential: cert(serviceKey as ServiceAccount ),
    });
} else{
    app = getApp();

}

const adminDb = getFirestore(app);


export { app as adminApp, adminDb };











