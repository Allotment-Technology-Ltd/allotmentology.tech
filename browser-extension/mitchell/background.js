chrome.commands.onCommand.addListener((command) => {
  if (command === "mitchell-ask") {
    void runMitchell();
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

async function runMitchell() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const url = tab.url || "";
  if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
    return;
  }

  let field;
  try {
    field = await chrome.tabs.sendMessage(tab.id, { type: "GET_QUESTION" });
  } catch {
    await chrome.tabs.sendMessage(tab.id, {
      type: "SHOW_TOAST",
      message: "Reload this page and try again (content script could not run).",
    }).catch(() => {});
    return;
  }

  if (!field?.ok) {
    await chrome.tabs.sendMessage(tab.id, {
      type: "SHOW_TOAST",
      message: field?.error ?? "Focus a text field first.",
    }).catch(() => {});
    return;
  }

  const cfg = await chrome.storage.sync.get(["baseUrl", "token", "opportunityId", "notes"]);
  const baseUrl = typeof cfg.baseUrl === "string" ? cfg.baseUrl.trim() : "";
  const token = typeof cfg.token === "string" ? cfg.token.trim() : "";
  const opportunityId = typeof cfg.opportunityId === "string" ? cfg.opportunityId.trim() : "";
  const notes = typeof cfg.notes === "string" ? cfg.notes : "";

  if (!baseUrl || !token || !opportunityId) {
    await chrome.runtime.openOptionsPage();
    await chrome.tabs.sendMessage(tab.id, {
      type: "SHOW_TOAST",
      message: "Open Mitchell extension options and set base URL, token, and opportunity id.",
    }).catch(() => {});
    return;
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/mitchell/qa`;

  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        opportunityId,
        question: field.question,
        notes: notes.trim(),
      }),
    });

    let data;
    try {
      data = await r.json();
    } catch {
      await chrome.tabs.sendMessage(tab.id, {
        type: "SHOW_TOAST",
        message: `Mitchell: bad response (${r.status}). Check API base URL.`,
      }).catch(() => {});
      return;
    }

    if (!data?.ok) {
      await chrome.tabs.sendMessage(tab.id, {
        type: "SHOW_TOAST",
        message: data?.error ?? `Mitchell failed (${r.status}).`,
      }).catch(() => {});
      return;
    }

    await chrome.tabs.sendMessage(tab.id, {
      type: "SET_RESPONSE",
      text: data.responseMarkdown,
    }).catch(() => {});
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await chrome.tabs.sendMessage(tab.id, {
      type: "SHOW_TOAST",
      message: `Network error: ${msg}`,
    }).catch(() => {});
  }
}
