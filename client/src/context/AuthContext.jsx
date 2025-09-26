import React, { useContext, useEffect, useState } from 'react';
import { auth, secondaryAuth } from '../firebase.jsx';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { db } from '../firebase.jsx';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } from "firebase/auth";


const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [secondaryUser, setSecondaryUser] = useState(null);

function signup(email, password, firstName, lastName, contactNumber, studentId, profileURL, coverURL, designation, address, gender, yearsOfService, middleName, educationalAttainment, bio) {
  console.log("SIGNUP INPUT:", { email, password, firstName, lastName, contactNumber, studentId });

  return createUserWithEmailAndPassword(auth, email, password)
    .then(async userCredential => {
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      const defaultRole = 'user';
      const defaultValue = ''; 

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        contactNumber,
        firstName,
        lastName,
        studentId,
        profileURL: defaultValue,
        coverURL: defaultValue,
        designation: defaultValue,
        address: defaultValue,
        yearsOfService: defaultValue,
        middleName: defaultValue,
        gender: defaultValue,
        educationalAttainment: defaultValue,
        bio: defaultValue,
        role: defaultRole, 
      });

      await setDoc(doc(db, "studentIndex", String(studentId)), {
        email,
        uid: user.uid
      });

      return userCredential;
    })
    .catch(error => {
      console.error("🔥 Signup error:", error.code, error.message);
      throw error;
    });
}

  async function login(studentId, password) {
    const indexDoc = await getDoc(doc(db, "studentIndex", String(studentId)));
    if (!indexDoc.exists()) throw new Error("Student ID not found");
    const { email } = indexDoc.data();
    return await signInWithEmailAndPassword(auth, email, password);
  }

  // --- Login (secondary user)
  async function loginSecondary(studentId, password) {
    const indexDoc = await getDoc(doc(db, "studentIndex", String(studentId)));
    if (!indexDoc.exists()) throw new Error("Student ID not found");
    const { email } = indexDoc.data();
    return await signInWithEmailAndPassword(secondaryAuth, email, password);
  }

  useEffect(() => {
    const unsub1 = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    const unsub2 = onAuthStateChanged(secondaryAuth, (user) => setSecondaryUser(user));
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const value = {
    currentUser,     
    secondaryUser,   
    signup,
    login,
    loginSecondary
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
