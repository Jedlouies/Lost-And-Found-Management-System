import React, { useContext, useEffect, useState } from "react";
import { auth, secondaryAuth } from "../firebase.jsx";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { db } from "../firebase.jsx";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [secondaryUser, setSecondaryUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password, firstName, lastName, contactNumber, studentId) {
    return createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        await updateProfile(user, { displayName: `${firstName} ${lastName}` });

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email,
          firstName,
          lastName,
          contactNumber,
          studentId,
          role: "user",
        });

        await setDoc(doc(db, "studentIndex", String(studentId)), {
          email,
          uid: user.uid,
        });

        return userCredential;
      });
  }

  async function login(studentId, password) {
    const indexDoc = await getDoc(doc(db, "studentIndex", String(studentId)));
    if (!indexDoc.exists()) throw new Error("Student ID not found");
    const { email } = indexDoc.data();
    return await signInWithEmailAndPassword(auth, email, password);
  }

  async function loginSecondary(studentId, password) {
    const indexDoc = await getDoc(doc(db, "studentIndex", String(studentId)));
    if (!indexDoc.exists()) throw new Error("Student ID not found");
    const { email } = indexDoc.data();
    return await signInWithEmailAndPassword(secondaryAuth, email, password);
  }

useEffect(() => {
  const setupAuth = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);

      const unsub1 = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user || null);
        setLoading(false);
      });

      const unsub2 = onAuthStateChanged(secondaryAuth, (user) => {
        setSecondaryUser(user || null);
      });
      return () => {
        unsub1();
        unsub2();
      };
    } catch (error) {
      console.error("Error setting session persistence:", error);
      setLoading(false);
    }
  };

  setupAuth();
}, []);
  const value = {
    currentUser,
    secondaryUser,
    signup,
    login,
    loginSecondary,
  };

  return (
  <AuthContext.Provider value={value}>
    {loading ? <div>Loading...</div> : children}
  </AuthContext.Provider>
);

}
