import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { useInactivityLogout } from '../hooks/useInactivityLogout';

function AppLayout() {
  const { logout } = useAuth();

  useInactivityLogout(logout);

  return <Stack screenOptions={{ headerShown: false }} />;
}


export default function Layout() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}