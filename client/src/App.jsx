import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import LogInPage from "./pages/LogInPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import { useAuth } from "./context/AuthContext"; 
import LostItemsPage from "./pages/LostItemsPage";
import SettingsPage from "./pages/SettingsPage";
import FoundItemsPage from "./pages/FoundItemsPage";
import ItemClaimedListPage from "./pages/ItemClaimedListPage";
import UserProfilesPage from "./pages/UserProfilesPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationPage from "./pages/NotificationPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const { currentUser } = useAuth(); 

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/log-in" element={<LogInPage />} />
          <Route
            path="/dashboard/:uid"
            element={
              currentUser ? (
                <DashboardPage />
              ) : (
                <></>
              )
            }
          />
          <Route
            path="/dashboard/profile/:uid"
            element={
              currentUser ? (
                <ProfilePage />
              ) : (
                <></>
              )
            }
          />
          <Route
            path="/admin/lost-items/:uid"
            element={
              currentUser ? (
                <LostItemsPage />
              ) : (
                <></>
              )
            }
          />
          <Route
            path="/admin/found-items/:uid"
            element={
              currentUser ? (
                <FoundItemsPage />
              ) : (
                <></>
              )
            }
          />
          <Route
            path="/admin/item-claimed-list/:uid"
            element={
              currentUser ? (
                <ItemClaimedListPage />
              ) : (
                <></>
              )
            }
          />
          <Route
            path="/admin/user-profiles/:uid"
            element={
              currentUser ? (
                <UserProfilesPage />
              ) : (
                <></>
              )
            }
          />
          <Route
            path="/admin/messages/:uid"
            element={
              currentUser ? (
                <MessagesPage />
              ) : (
                <></>
              )
            }
            />
            <Route 
              path="/admin/notifications/:uid"
              element={
                currentUser ? (
                  <NotificationPage />
                ) : (
                  <></>
                )
              }
              />
            <Route
            path="/admin/settings/:uid"
            element={
              currentUser ? (
                <SettingsPage />
              ) : (
                <></>
              )
            }
          />
          <Route
            path="/home/:uid"
            element={
              currentUser ? (
                <HomePage />
              ) : (
               <></>
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
