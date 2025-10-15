import React, { useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import createVerificationCode from "../utils/createVerificationCode";
import VerificationModal from "../components/VerificationModal";
import { useRouter } from "expo-router";

export default function CreateAccountScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  const refs = {
    firstName: useRef(""),
    lastName: useRef(""),
    studentId: useRef(""),
    email: useRef(""),
    contact: useRef(""),
    password: useRef(""),
    confirm: useRef(""),
  };

  const handleSubmit = async () => {
    if (refs.password.current !== refs.confirm.current)
      return Alert.alert("Error", "Passwords do not match");

    setLoading(true);
    const userData = {
      firstName: refs.firstName.current,
      lastName: refs.lastName.current,
      studentId: refs.studentId.current,
      contactNumber: refs.contact.current,
      email: refs.email.current,
      password: refs.password.current,
    };

    const code = await createVerificationCode(userData);
    setPendingUser(userData);
    setShowVerify(true);
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {Object.entries(refs).map(([key, ref]) =>
        key !== "confirm" ? (
          <TextInput key={key} placeholder={key} style={styles.input} onChangeText={(val) => (ref.current = val)} />
        ) : null
      )}

      <TextInput placeholder="Confirm Password" style={styles.input} secureTextEntry onChangeText={(val) => (refs.confirm.current = val)} />

      <TouchableOpacity disabled={loading} style={styles.button} onPress={handleSubmit}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Create</Text>}
      </TouchableOpacity>

      {showVerify && (
        <VerificationModal user={pendingUser} onVerified={() => router.push("/login")} onClose={() => setShowVerify(false)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f5f9ff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, marginVertical: 5 },
  button: { backgroundColor: "#BDDDFC", padding: 12, borderRadius: 8, marginTop: 10, width: "100%", alignItems: "center" },
  btnText: { color: "black", fontWeight: "bold" },
});
