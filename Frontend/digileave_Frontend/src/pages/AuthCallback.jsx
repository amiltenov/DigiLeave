import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../auth";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.slice(1); // "token=JWT..."
    const token = new URLSearchParams(hash).get("token");
    if (token) setToken(token);
    navigate("/", { replace: true });
  }, [navigate]);

  return <div style={{ padding: 16 }}>Signing you in…</div>;
}
