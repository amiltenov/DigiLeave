let memToken = null;

// Save token (in memory + localStorage)
export function setToken(t) {
  memToken = t || null;
  if (t) {
    localStorage.setItem("jwt", t);
  } else {
    localStorage.removeItem("jwt");
  }
}

// Get token (prefer memory, fallback to localStorage)
export function getToken() {
  return memToken || localStorage.getItem("jwt") || null;
}

// Build Authorization header
export function authHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Clear token (logout)
export function logout() {
  setToken(null);
}
