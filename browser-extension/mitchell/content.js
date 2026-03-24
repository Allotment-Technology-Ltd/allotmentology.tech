/** @param {Event} e */
function isTextTarget(t) {
  if (!t || !t.tagName) return false;
  if (t.tagName === "TEXTAREA") return true;
  if (t.tagName === "INPUT") {
    const type = (t.type || "text").toLowerCase();
    return (
      type === "text" ||
      type === "search" ||
      type === "url" ||
      type === "email" ||
      type === ""
    );
  }
  return false;
}

/** @type {HTMLInputElement | HTMLTextAreaElement | null} */
let lastTextField = null;

document.addEventListener(
  "focusin",
  (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    if (isTextTarget(t)) {
      lastTextField = /** @type {HTMLInputElement | HTMLTextAreaElement} */ (t);
    }
  },
  true,
);

function currentField() {
  const active = document.activeElement;
  if (isTextTarget(active)) {
    return /** @type {HTMLInputElement | HTMLTextAreaElement} */ (active);
  }
  return lastTextField;
}

function showToast(message) {
  const el = document.createElement("div");
  el.textContent = message;
  el.setAttribute("data-mitchell-toast", "1");
  el.style.cssText =
    "position:fixed;bottom:16px;right:16px;max-width:min(360px,calc(100vw - 32px));padding:12px 16px;background:#18181b;color:#fafafa;font:13px/1.4 system-ui,sans-serif;border-radius:10px;z-index:2147483647;box-shadow:0 8px 32px rgba(0,0,0,.45);border:1px solid #3f3f46;";
  document.documentElement.appendChild(el);
  setTimeout(() => el.remove(), 8000);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "GET_QUESTION") {
    const el = currentField();
    if (!el) {
      sendResponse({ ok: false, error: "Focus a text field first (or click into one, then try again)." });
      return;
    }
    const question = typeof el.value === "string" ? el.value : "";
    sendResponse({ ok: true, question });
    return;
  }
  if (msg?.type === "SET_RESPONSE") {
    const text = typeof msg.text === "string" ? msg.text : "";
    const el = currentField();
    if (!el || !("value" in el)) {
      sendResponse({ ok: false, error: "Could not write response — focus the same field and retry." });
      return;
    }
    el.value = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    showToast("Mitchell response inserted. Review before you submit.");
    sendResponse({ ok: true });
    return;
  }
  if (msg?.type === "SHOW_TOAST") {
    showToast(typeof msg.message === "string" ? msg.message : "Mitchell error.");
    sendResponse({ ok: true });
    return;
  }
});
