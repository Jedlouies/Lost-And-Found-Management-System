// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import LogInPage from "./pages/LogInPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./user_pages/HomePage";
import { getAuth } from "firebase/auth";
import { useEffect } from "react";
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
import GuestReportPage from "./pages/GuestReportPage";
import GuestReportLostPage from "./pages/GuestReportLostPage";
import GuestLostMatchResults from "./pages/GuestLostMatchResults";
import GuestFoundMatchResults from "./pages/GuestFoundMatchResults";
import GuestReportFoundPage from "./pages/GuestReportFoundPage";
import GuestEmailRequestPage from "./pages/GuestEmailRequestPage";
import ErrorBoundary from "./components/ErrorBoundary";
import GuestProcessClaimPage from "./pages/GuestProcessClaimPage";
import InactivityHandler from "./InactivityHandler";

function App() {


  return (
    <div>
      <NotificationProvider>
        <BrowserRouter>
          <InactivityHandler timeout={5 * 60 * 1000} />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/log-in" element={<LogInPage />} />

            <Route path="/dashboard/:uid" element={<DashboardPage />} />
            <Route path="/dashboard/profile/:uid" element={<ProfilePage />} />
            <Route path="/admin/lost-items/:uid" element={<ErrorBoundary><LostItemsPage /></ErrorBoundary>} />
            <Route path="/admin/found-items/:uid" element={<FoundItemsPage />} />
            <Route path="/admin/item-claimed-list/:uid" element={<ItemClaimedListPage />} />
            <Route path="/admin/lost-items/view-items/:uid" element={<ItemViewDetailsPage />} />
            <Route path="/admin/found-items/view-items/:uid" element={<ItemViewDetailsPage />} />
            <Route path="/admin/view-profile/:uid" element={<ViewProfilePage />} />
            <Route path="/admin/user-profiles/:uid" element={<UserProfilesPage />} />
            <Route path="/admin/messages/:uid" element={<MessagesPage />} />
            <Route path="/admin/notifications/:uid" element={<NotificationPage />} />
            <Route path="/admin/settings/:uid" element={<SettingsPage />} />
            <Route path="/admin/transactions/:uid" element={<TransactionPage />} />
            <Route path="/admin/process-claim/:uid" element={<ProcessClaimPage />} />
            <Route path="/admin/guest/process-claim/:uid" element={<GuestProcessClaimPage />} />
            <Route path="/admin/found-items/archive/:uid" element={<ArchivedFoundItemsPage />} />
            <Route path="/admin/lost-items/archive/:uid" element={<ArchivedLostItemsPage />} />

            <Route path="/home/:uid" element={<HomePage />} />
            <Route path="/users/lost-items/:uid" element={<UserLostItemsPage />} />
            <Route path="/users/lost-items/more-details/:uid" element={<ItemMoreDetailsPage />} />
            <Route path="/users/found-items/more-details/:uid" element={<ItemMoreDetailsPage />} />
            <Route path="/users/found-items/:uid" element={<UserFoundItemsPage />} />
            <Route path="/home/profile/:uid" element={<UserProfilePage />} />
            <Route path="/users/settings/:uid" element={<UserSettingsPage />} />
            <Route path="/users/lost-items/procedure/:uid" element={<UserLostProcedurePage />} />
            <Route path="/users/lost-items/procedure/item-details/:uid" element={<UserLostItemDetailPage />} />
            <Route path="/users/found-items/procedure/:uid" element={<UserFoundProcedurePage />} />
            <Route path="/users/found-items/procedure/item-details/:uid" element={<UserFoundItemDetailPage />} />
            <Route path="/users/lost-items/ai-matching/:uid" element={<MatchItems />} />
            <Route path="/users/found-items/matching/:uid" element={<FoundMatchResults />} />
            <Route path="/users/lost-items/matching/:uid" element={<LostMatchResults />} />
            <Route path="/users/item-management/:uid" element={<ItemManagementPage />} />
            <Route path="/users/item-management/archived/:uid" element={<ArchivedItemManagementPage />} />
            <Route path="/users/item-management/more-details/:uid" element={<MatchMoreDetailsPage />} />
            <Route path="/users/messages/:uid" element={<UserMessagesPage />} />
            <Route path="/users/notifications/:uid" element={<UserNotificationPage />} />

            <Route path="/guest/:uid" element={<GuestReportPage />} />
            <Route path="/guest/email/:uid" element={<GuestEmailRequestPage />} />
            <Route path="/guest/lost/:uid" element={<GuestReportLostPage />} />
            <Route path="/guest/found/:uid" element={<GuestReportFoundPage />} />
            <Route path="/guest/lost/matching/:uid" element={<GuestLostMatchResults />} />
            <Route path="/guest/found/matching/:uid" element={<GuestFoundMatchResults />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </div>
  );
}

export default App;
