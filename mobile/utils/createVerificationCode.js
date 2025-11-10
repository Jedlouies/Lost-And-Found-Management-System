import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Creates a 6-digit verification code and saves it to Firestore.
 * @param {string} email - The user's email address.
 * @param {string | null} [uid] - The user's unique ID (optional).
 * @returns {Promise<string>} The generated 6-digit code.
 */
async function createVerificationCode(
  email: string,
  uid: string | null = null
): Promise<string> {
  if (!email) {
    throw new Error("Missing user email when creating verification code.");
  }
  

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const verificationData: any = {
    email,
    code,
    createdAt: serverTimestamp(),
  };

  if (uid) {
    verificationData.uid = uid;
  }

  await addDoc(collection(db, "verifications"), verificationData);

  return code;
}

export default createVerificationCode;