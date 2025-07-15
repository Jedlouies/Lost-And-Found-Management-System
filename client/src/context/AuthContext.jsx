import React, { useContext, useEffect, useState } from 'react';
import { auth } from '../firebase.jsx';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { db } from '../firebase.jsx';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

function signup(email, password, firstName, lastName, contactNumber, studentId) {
  console.log("SIGNUP INPUT:", { email, password, firstName, lastName, contactNumber, studentId });

  return createUserWithEmailAndPassword(auth, email, password)
    .then(async userCredential => {
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      const defaultRole = 'user'; 

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        contactNumber,
        firstName,
        lastName,
        studentId,
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
    try {
      const indexDoc = await getDoc(doc(db, "studentIndex", String(studentId)));
      if (!indexDoc.exists()) {
        throw new Error("Student ID not found");
      }

      const { email } = indexDoc.data();
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("🔥 Login error:", error.code || error.message);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
