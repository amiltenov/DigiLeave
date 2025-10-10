import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Account from "./pages/Account";
import Requests from "./pages/Requests";
import NewRequest from "./pages/NewRequest";
import AuthCallback from "./pages/AuthCallback";
import Admin from "./pages/Admin";
import Approver from "./pages/Approver";
import FooterWaves from "./components/FooterWaves";


function App() {
  return (
    <Router>
      <Header />
      <main style={{ minHeight: "80vh" }}>
        <Routes>
          <Route path="/" element={<div style={{ padding: "16px 24px" }}>Home</div>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/requests/new" element={<NewRequest />} />
          <Route path="/approver" element={<Approver />} />
        </Routes>
      </main>
       <FooterWaves />
      <Footer />
    </Router>
  );
}

export default App;
