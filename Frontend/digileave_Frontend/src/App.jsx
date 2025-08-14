import React, { useEffect, useState } from "react";


export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BACKEND_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:8080/users"; // override via env

  const fetchMe = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:8080/users`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUser(data);
      console.log(data);
    } catch (e) {
      setError(e.message || "Failed to fetch ");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
 
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <GradientBg />
      <style>{globalStyles}</style>

      <Header backendOrigin={BACKEND_ORIGIN} />

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <section className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white drop-shadow-sm">DigiLeave Dashboard</h1>

          <div className="glass p-5 md:p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-semibold">Users</h2>
                <p className="text-sm opacity-80">Fetched from {BACKEND_ORIGIN}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn" onClick={fetchMe} disabled={loading}>
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            {loading && <SkeletonRows />}

            {!loading && error && (
              <div className="alert">
                <strong>Couldn\'t load user.</strong>
                <div className="text-sm opacity-90 mt-1">{error}</div>
                <div className="text-xs opacity-70 mt-2">Make sure your Spring Boot server is running on {BACKEND_ORIGIN} and CORS allows http://localhost:5173.</div>
              </div>
            )}

            {!loading && !error && (
              <UserCard user={user} />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Header({ backendOrigin }) {
  return (
    <header className="sticky top-0 z-30">
      <div className="glass rounded-b-3xl mx-2 md:mx-4 mt-2 px-4 md:px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <img
  src="/digilogo.png"
  alt="DigiLeave Logo"
  style={{ width: "100px", height: "80px", borderRadius: "50%", objectFit: "contain" }}
/>

          
        </div>
        <nav className="flex items-center gap-2">
          <a className="btn btn-ghost" href="#">Home</a>
          <a className="btn btn-ghost" href="#requests">Requests</a>
          {/* <a className="btn btn-ghost" href="#profile">Profile</a> */}
        </nav>
        <div className="flex items-center gap-2">
          <a
            className="btn btn-primary"
            href={`http://localhost:8080/auth/post-login`}
          >
            Profile
          </a>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-8">
      <div className="glass rounded-t-3xl mx-2 md:mx-4 mb-2 px-4 md:px-6 py-4 text-sm flex flex-col md:flex-row items-center justify-between gap-2">
        <div>© {new Date().getFullYear()} DigiLeave. All rights reserved.</div>
        <div className="opacity-80">Built with React + Vite • Spring Boot • MongoDB</div>
      </div>
    </footer>
  );
}

function UserCard({ user }) {
  // not signed in (single-object case) or empty array
  if (!user || (Array.isArray(user) && user.length === 0) || user?.authenticated === false) {
    return (
      <div className="empty">
        <div className="text-base md:text-lg">Not signed in.</div>
        <div className="text-sm opacity-80">Use the Google button above to authenticate.</div>
      </div>
    );
  }

  // helper to render one user block
  const One = (u) => {
    const rows = [
      ["Email", u?.email],
      ["Role", u?.role],
      ["Available Leave Days", u?.availableLeaveDays],
      ["Mongo Id", u?.id],
    ];
    return (
      <div className="space-y-4 glass p-4 rounded-2xl shadow-xl" key={u?.id || u?.email}>
        <div className="flex items-center gap-4">
          <Avatar email={u?.email} />
          <div>
            <div className="text-lg font-semibold">{u?.email ?? "—"}</div>
            <div className="text-sm opacity-80">Role: {u?.role ?? "—"}</div>
          </div>
        </div>
        <div className="tableWrap">
          <table className="niceTable">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td>{v ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // array -> list, object -> single
  return Array.isArray(user) ? (
    <div className="space-y-4">
      {user.map((u) => One(u))}
    </div>
  ) : (
    One(user)
  );
}


function Avatar({ email }) {
  const initials = (email || "?").slice(0, 2).toUpperCase();
  return (
    <div className="avatar" aria-label="avatar">
      {initials}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="skeletonGrid">
      {Array.from({ length: 5 }).map((_, i) => (
        <div className="skeletonRow" key={i} />
      ))}
    </div>
  );
}



function GradientBg() {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/40 via-indigo-500/30 to-purple-500/40" />
      <div className="noise" />
    </div>
  );
}

const globalStyles = `
  /* ====== Layout utilities ====== */
  .min-h-screen {min-height: 100vh;}
  .flex {display:flex;} .flex-col{flex-direction:column;} .flex-1{flex:1;}
  .w-full{width:100%;}
  .container{width:100%; max-width:100%;}
  .mx-auto{margin-left:0; margin-right:0;}      /* kill centering */
  .px-4{padding-left:1rem; padding-right:1rem;} .px-6{padding-left:1.5rem; padding-right:1.5rem;} .md\\:px-8{padding-left:2rem; padding-right:2rem;}
  .py-3{padding-top:.75rem; padding-bottom:.75rem;} .py-4{padding-top:1rem; padding-bottom:1rem;} .py-8{padding-top:2rem; padding-bottom:2rem;}
  .mt-2{margin-top:.5rem;} .mt-8{margin-top:2rem;} .mb-2{margin-bottom:.5rem;} .mb-4{margin-bottom:1rem;} .mb-6{margin-bottom:1.5rem;}
  .rounded-2xl{border-radius:1rem;} .rounded-3xl{border-radius:1.5rem;} .rounded-b-3xl{border-bottom-left-radius:1.5rem; border-bottom-right-radius:1.5rem;}
  .rounded-t-3xl{border-top-left-radius:1.5rem; border-top-right-radius:1.5rem;}
  .shadow-lg{box-shadow:0 10px 25px rgba(0,0,0,.15);} .shadow-xl{box-shadow:0 20px 40px rgba(0,0,0,.2);} 
  .text-white{color:white;} .text-3xl{font-size:1.875rem;} .text-4xl{font-size:2.25rem;} .text-xl{font-size:1.25rem;} .text-lg{font-size:1.125rem;} .text-sm{font-size:.875rem;} .text-xs{font-size:.75rem;}
  .font-bold{font-weight:700;} .font-semibold{font-weight:600;}
  .drop-shadow-sm{text-shadow:0 1px 1px rgba(0,0,0,.3);} 
  .leading-tight{line-height:1.15;}
  .grid{display:grid;} .gap-2{gap:.5rem;} .gap-3{gap:.75rem;} .gap-4{gap:1rem;} .space-y-4 > * + *{margin-top:1rem;}
  .items-center{align-items:center;} .justify-between{justify-content:space-between;}
  .sticky{position:sticky;} .top-0{top:0;} .z-30{z-index:30;} .-z-10{z-index:-10;}
  .opacity-70{opacity:.7;} .opacity-80{opacity:.8;}
  .max-w-3xl{max-width:100%;}

  /* ====== Body: keep transparent for Three.js bg ====== */
  body {
    margin:0;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
    color:#0b0b0b;
    background: transparent; /* don't cover your 3D canvas */
  }

  /* ====== Force header/footer full-width (override old margins/radius) ====== */
  header, footer { width:100%; }
  header .mx-2, header .mx-4, footer .mx-2, footer .mx-4 { margin-left:0 !important; margin-right:0 !important; width:100% !important; }
  header .rounded-b-3xl, header .rounded-3xl,
  footer .rounded-t-3xl, footer .rounded-3xl { border-radius:0 !important; }

  /* ====== Glassmorphism ====== */
  .glass { 
    background: linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,.35));
    border: 1px solid rgba(0,0,0,.06);
    backdrop-filter: blur(14px) saturate(120%);
    -webkit-backdrop-filter: blur(14px) saturate(120%);
    box-shadow: 0 10px 30px rgba(0,0,0,.15);
  }

  /* ====== Buttons (yellow/black) ====== */
  .btn { 
    appearance: none;
    border: 1px solid rgba(0,0,0,.08);
    padding: .5rem .9rem; border-radius: .9rem; 
    background: linear-gradient(180deg, rgba(255,255,255,.65), rgba(255,255,255,.25));
    backdrop-filter: blur(10px);
    font-weight: 600; cursor: pointer;
    transition: transform .06s ease, box-shadow .2s ease, background .2s ease;
    color: #0b0b0b;
  }
  .btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,.15); }
  .btn:active { transform: translateY(0); }
  .btn[disabled] { opacity:.6; cursor: not-allowed; }
  .btn-ghost { background: transparent; border-color: rgba(0,0,0,.08); }
  .btn-primary { color:#0b0b0b; border:none; background: linear-gradient(135deg, #FFD733 0%, #FFC400 100%); }

  /* ====== Alerts ====== */
  .alert { 
    border: 1px solid rgba(255,196,0,.55);
    background: linear-gradient(180deg, rgba(255,221,51,.25), rgba(255,221,51,.15));
    padding: 1rem; border-radius: 1rem; 
    color: #0b0b0b;
  }

  /* ====== Tables ====== */
  .tableWrap { overflow: hidden; border-radius: 1rem; border: 1px solid rgba(0,0,0,.06); width:100%; }
  .niceTable { width: 100%; border-collapse: collapse; }
  .niceTable th, .niceTable td { padding: .9rem 1rem; text-align: left; }
  .niceTable th {
    width: 40%;
    background: linear-gradient(180deg, rgba(255,221,51,.45), rgba(255,221,51,.2));
    font-weight:600; color:#0b0b0b;
  }
  .niceTable tr + tr th, .niceTable tr + tr td { border-top: 1px solid rgba(0,0,0,.06); }

  /* ====== Avatar ====== */
  .avatar {
    width: 56px; height: 56px; border-radius: 50%;
    display:flex; align-items:center; justify-content:center; font-weight:700;
    background: linear-gradient(135deg, #FFD733, #FFC400);
    color:#0b0b0b;
    box-shadow: inset 0 0 0 2px rgba(255,255,255,.8);
  }
`;
