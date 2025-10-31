import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/requests.css";

import RequestsViewModeMenu from "../components/RequestComponents/RequestsViewModeMenu";
import RequestsViewMode from "../components/RequestComponents/RequestsViewMode";
import { authHeader } from "../utils/auth";
import { STATE } from "../utils/state";
import { BASE_API_URL } from "../utils/base_api_url";

export default function Requests() {
  const [viewState, setViewState] = useState(STATE.LOADING);
  const [data, setData] = useState([]);
  const [view, setView] = useState("cards");
  const [sortBy, setSortBy] = useState("pending-first");
  const [sortOrder, setSortOrder] = useState("asc");
  const [userName, setUserName] = useState("User");


  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    (async () => {
      try {
        setViewState(STATE.LOADING);

        const res = await fetch(`${BASE_API_URL}/requests`, {
          headers: authHeader(),
          signal: ctrl.signal,
        });

        if (res.status === 401) {
          if (alive) setViewState(STATE.UNAUTH);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (!alive) return;

        const list = Array.isArray(json) ? json : [];
        setData(list);
        setViewState(list.length ? STATE.READY : STATE.EMPTY);
      } catch (e) {
        if (alive && e.name !== "AbortError") setViewState(STATE.ERROR);
      }
    })();

    return () => { alive = false; ctrl.abort(); };
  }, []);

  useEffect(() =>{
    fetch(`${BASE_API_URL}/account`, { headers: authHeader() })

    .then(res => {
      if (res.status === 401) {
        setState(STATUS.UNAUTH);
        return null;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      return res.json();
    })
    .then(json => {
      if(json){
        setUserName(json.fullName.slice(0, json.fullName.indexOf(" ")));
      }
    })
    .catch((err) => {
      setState(STATE.ERROR)
      console.warn(`Error: ${err}`);
    })
  }, []);

  const handleAfterAction = (updated) => {
    setData(prev => prev.map(r => (r.id === updated.id ? updated : r)));
  };

  return (
    <div className="requests-root">
      <div className="requests-inner">
        <div className="rq-pagehead">
          <div>
            <h1 className="rq-h1">My Leave Requests</h1>
            <p className="rq-muted">Hello {userName}.</p>
          </div>
          <Link className="new-request-btn" to="/requests/new">+ New Request</Link>
        </div>

        <RequestsViewModeMenu
           view={view}
            onChangeView={setView}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onChangeSortBy={setSortBy}
            onChangeSortOrder={setSortOrder}
        />

        {viewState === STATE.LOADING && (
          <div className="centered rq-empty">
            <div className="rq-skeleton" />
            <p className="rq-muted">Loading…</p>
          </div>
        )}

        {viewState === STATE.UNAUTH && (
          <div className="centered rq-empty">
            <h3>Sign in required</h3>
            <a className="rq-oauth" href={`${BASE_API_URL}/oauth2/authorization/google`}>Continue with Google</a>
          </div>
        )}

        {viewState === STATE.ERROR && (
          <div className="centered rq-empty">
            <h3>Something went wrong</h3>
            <p className="rq-muted">Please try again.</p>
          </div>
        )}

        {viewState === STATE.EMPTY && (
          <div className="centered rq-blank">
            <h3>No requests yet</h3>
            <p className="rq-muted">Start by creating your first leave request.</p>
            <Link className="new-request-btn" to="/requests/new">+ New Request</Link>
          </div>
        )}

        {viewState === STATE.READY && (
          <RequestsViewMode
            items={data}
            sortBy={sortBy}
            sortOrder={sortOrder}
            view={view}
            onChangeView={setView}
            role="user"
            apiOrigin={BASE_API_URL}
            authHeader={authHeader}
            onAfterAction={handleAfterAction}
          />
        )}
      </div>
    </div>
  );
}
