import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

async function createVerificationCode(user) {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

  await addDoc(collection(db, "verifications"), {
  email: user.email,
  code,
  createdAt: serverTimestamp(),
});


  return code;
}

export default createVerificationCode;
