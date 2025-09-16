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
import ItemManagementPage from "./user_pages/ItemManagementPage";
import UserMessagesPage from "./user_pages/UserMessagesPage";
import UserNotificationPage from "./user_pages/UserNotificationPage";
import TransactionPage from "./pages/TransactionPage";
import ProcessClaimPage from "./pages/ProcessClaimPage";
import ItemMoreDetailsPage from "./user_pages/ItemMoreDetailsPage";
import ItemViewDetailsPage from "./pages/ItemViewDetailsPage";
import ViewProfilePage from "./pages/ViewProfilePage";
import { NotificationProvider } from "./context/NotificationContext";
import MatchMoreDetailsPage from "./user_pages/MatchMoreDetailsPage";
import ArchivedItemManagementPage from "./user_pages/ArchivedItemManagement";
import ArchivedFoundItemsPage from "./pages/ArchivedFoundItemPage";
import ArchivedLostItemsPage from "./pages/ArchivedLostItemPage";
import GuestReportPage from "./pages/GuestReportPage"
import GuestReportLostPage from "./pages/GuestReportLostPage";
import GuestLostMatchResults from "./pages/GuestLostMatchResults";
import GuestFoundMatchResults from "./pages/GuestFoundMatchResults";
import GuestReportFoundPage from "./pages/GuestReportFoundPage";
import GuestEmailRequestPage from "./pages/GuestEmailRequestPage";


function App() {
  const { currentUser } = useAuth(); 

  return (
    <div>
      <NotificationProvider>
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
            path="/admin/lost-items/view-items/:uid"
            element={
              currentUser ? (
                <ItemViewDetailsPage />
              ) : (
                <></>
              )
            }
          />
          <Route
            path="/admin/found-items/view-items/:uid"
            element={
              currentUser ? (
                <ItemViewDetailsPage />
              ) : (
                <></>
              )
            }
          />
          <Route
            path="/admin/view-profile/:uid"
            element={
              currentUser ? (
                <ViewProfilePage />
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
            path="/admin/transactions/:uid"
            element={
              currentUser ? (
                <TransactionPage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/admin/process-claim/:uid"
            element={
              currentUser ? (
                <ProcessClaimPage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/admin/found-items/archive/:uid"
            element={
              currentUser ? (
                <ArchivedFoundItemsPage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/admin/lost-items/archive/:uid"
            element={
              currentUser ? (
                <ArchivedLostItemsPage />
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
            path="/users/lost-items/more-details/:uid"
            element={
              currentUser ? (
                <ItemMoreDetailsPage />
              ) : (
                <></>
              )
            }
          />
          <Route
            path="/users/found-items/more-details/:uid"
            element={
              currentUser ? (
                <ItemMoreDetailsPage />
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
           <Route
            path="/users/item-management/:uid"
            element={
              currentUser ? (
                <ItemManagementPage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/users/item-management/archived/:uid"
            element={
              currentUser ? (
                <ArchivedItemManagementPage />
              ) : (
               <></>
              )
            }
          />
          
          <Route
            path="/users/item-management/more-details/:uid"
            element={
              currentUser ? (
                <MatchMoreDetailsPage />
              ) : (
               <></>
              )
            }
          />
           <Route
            path="/users/messages/:uid"
            element={
              currentUser ? (
                <UserMessagesPage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/users/notifications/:uid"
            element={
              currentUser ? (
                <UserNotificationPage />
              ) : (
               <></>
              )
            }
          />








            <Route
            path="/guest/:uid"
            element={
              currentUser ? (
                <GuestReportPage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/guest/email/:uid"
            element={
              currentUser ? (
                <GuestEmailRequestPage />
              ) : (
               <></>
              )
            }
          />
           <Route
            path="/guest/lost/:uid"
            element={
              currentUser ? (
                <GuestReportLostPage />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/guest/found/:uid"
            element={
              currentUser ? (
                <GuestReportFoundPage />
              ) : (
               <></>
              )
            }
          />
           <Route
            path="/guest/lost/matching/:uid"
            element={
              currentUser ? (
                <GuestLostMatchResults />
              ) : (
               <></>
              )
            }
          />
          <Route
            path="/guest/found/matching/:uid"
            element={
              currentUser ? (
                <GuestFoundMatchResults />
              ) : (
               <></>
              )
            }
          />
          

           
          

          
        </Routes>        
      </BrowserRouter>
      </NotificationProvider>
    </div>
  );
}

export default App;
