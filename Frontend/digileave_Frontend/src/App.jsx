import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Account from "./pages/Account";
import Requests from "./pages/Requests";
import NewRequest from "./pages/NewRequest";

function App() {
  return (
    <Router>
      <Header />
      <main style={{ minHeight: "80vh" }}>
        <Routes>
          <Route path="/" element={<div style={{ padding: "16px 24px" }}>Home</div>} />
          <Route path="/account" element={<Account />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/requests/new" element={<NewRequest />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
