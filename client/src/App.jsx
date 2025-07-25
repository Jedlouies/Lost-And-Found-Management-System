import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import LogInPage from "./pages/LogInPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./user_pages/HomePage";
import { useAuth } from "./context/AuthContext"; 
import LostItemsPage from "./pages/LostItemsPage";
import SettingsPage from "./pages/SettingsPage";
import FoundItemsPage from "./pages/FoundItemsPage";
import ItemClaimedListPage from "./pages/ItemClaimedListPage";
import UserProfilesPage from "./pages/UserProfilesPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationPage from "./pages/NotificationPage";
import ProfilePage from "./pages/ProfilePage";
import UserLostItemsPage from "./user_pages/UserLostItemsPage";
import UserFoundItemsPage from "./user_pages/UserFoundItemsPage";
import UserProfilePage from "./user_pages/UserProfilePage";
import UserSettingsPage from "./user_pages/UserSettingsPage";
import UserLostItemDetailPage from "./user_pages/UserLostItemDetailPage";
import UserFoundItemDetailPage from "./user_pages/UserFoundItemDetailPage";
import UserLostProcedurePage from "./user_pages/UserLostProcedurePage";
import UserFoundProcedurePage from "./user_pages/UserFoundProcedurePage";
import MatchItems from "./user_pages/MatchItems";
import FoundMatchResults from "./user_pages/FoundMatchResults";
import LostMatchResults from "./user_pages/LostMatchResults";


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
          <Route
            path="/users/lost-items/:uid"
            element={
              currentUser ? (
                <UserLostItemsPage />
              ) : (
               <></>
              )
            }
          />
           <Route
            path="/users/found-items/:uid"
            element={
              currentUser ? (
                <UserFoundItemsPage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/home/profile/:uid"
            element={
              currentUser ? (
                <UserProfilePage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/users/settings/:uid"
            element={
              currentUser ? (
                <UserSettingsPage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/users/lost-items/procedure/:uid"
            element={
              currentUser ? (
                <UserLostProcedurePage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/users/lost-items/procedure/item-details/:uid"
            element={
              currentUser ? (
                <UserLostItemDetailPage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/users/found-items/procedure/:uid"
            element={
              currentUser ? (
                <UserFoundProcedurePage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/users/found-items/procedure/item-details/:uid"
            element={
              currentUser ? (
                <UserFoundItemDetailPage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/users/lost-items/ai-matching/:uid"
            element={
              currentUser ? (
                <MatchItems />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/users/found-items/matching/:uid"
            element={
              currentUser ? (
                <FoundMatchResults />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/users/lost-items/matching/:uid"
            element={
              currentUser ? (
                <LostMatchResults />
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
