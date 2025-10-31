let memToken = null;


export function setToken(t) {
  memToken = t || null;
  if (t) {
    localStorage.setItem("jwt", t);
  } else {
    localStorage.removeItem("jwt");
  }
}


export function getToken() {
  return memToken || localStorage.getItem("jwt") || null;
}

export function authHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}


export function logout() {
  setToken(null);
}
