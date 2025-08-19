import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="glass-footer">
      <p>© {new Date().getFullYear()} DigiLeave. All rights reserved.</p>
    </footer>
  );
}
