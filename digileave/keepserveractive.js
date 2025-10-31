const PING_URL = "https://digileave.onrender.com";
const INTERVAL_MS = 5 * 60 * 1000;

async function ping() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    
    await fetch(PING_URL, {
      method: "GET",
      cache: "no-store",
      mode: "no-cors",
      signal: controller.signal,
    });
  } catch (_) {

  } finally {
    clearTimeout(timeout);
  }
}

ping();
setInterval(ping, INTERVAL_MS);