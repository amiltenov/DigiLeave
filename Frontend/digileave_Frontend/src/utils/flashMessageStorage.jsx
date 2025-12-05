const FLASH_KEY = "digileave_flash_message";

export function setFlashMessage(message) {
  try {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify(message));
  } catch {
  }
}

export function getFlashMessage() {
  try {
    const raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(FLASH_KEY);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}
