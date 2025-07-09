import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import LogInPage from "./pages/LogInPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import { useAuth } from "./context/AuthContext"; 

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
