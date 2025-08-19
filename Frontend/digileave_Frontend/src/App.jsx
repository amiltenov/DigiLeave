
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  const dummyUser = {
    email: "john@example.com",
    role: "Admin",
    availableLeaveDays: 12,
    id: "abc123",
    authenticated: true,
  };

  return (
    <>
      <Header />
      <Footer />
    </>
  );
}

export default App;
