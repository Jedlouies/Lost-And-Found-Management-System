import React, { useContext, useEffect, useState } from 'react';
import { auth, secondaryAuth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signOut // Imported signOut
} from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ActivityIndicator, View, StyleSheet } from 'react-native'; // Import native components

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
      .then(async userCredential => {
        const user = userCredential.user;
        await updateProfile(user, { displayName: `${firstName} ${lastName}` });

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email,
          contactNumber,
          firstName,
          lastName,
          studentId,
          profileURL: '',
          coverURL: '',
          designation: '',
          address: '',
          yearsOfService: '',
          middleName: '',
          gender: '',
          educationalAttainment: '',
          bio: '',
          role: 'user', 
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

  async function loginSecondary(studentId, password) {
    const indexDoc = await getDoc(doc(db, "studentIndex", String(studentId)));
    if (!indexDoc.exists()) throw new Error("Student ID not found");
    const { email } = indexDoc.data();
    return await signInWithEmailAndPassword(secondaryAuth, email, password);
  }

  function logout() {
    return Promise.all([
      signOut(auth),
      signOut(secondaryAuth)
    ]);
  }

  useEffect(() => {
    const unsub1 = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); 
    });
    
    const unsub2 = onAuthStateChanged(secondaryAuth, (user) => {
      setSecondaryUser(user);
    });

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
    loginSecondary,
    logout, 
    loading 
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}