import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../utils/auth";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token");
    const error = params.get("error");

    if (token) setToken(token);
    if (error) alert("Use your @digitoll.bg account");

    navigate("/", { replace: false });
  }, [navigate]);

  return <div style={{ padding: 16 }}>Signing you in…</div>;
}
