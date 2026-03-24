const baseUrl = document.getElementById("baseUrl");
const token = document.getElementById("token");
const opportunityId = document.getElementById("opportunityId");
const notes = document.getElementById("notes");
const save = document.getElementById("save");
const status = document.getElementById("status");

chrome.storage.sync.get(["baseUrl", "token", "opportunityId", "notes"], (cfg) => {
  if (typeof cfg.baseUrl === "string") baseUrl.value = cfg.baseUrl;
  if (typeof cfg.token === "string") token.value = cfg.token;
  if (typeof cfg.opportunityId === "string") opportunityId.value = cfg.opportunityId;
  if (typeof cfg.notes === "string") notes.value = cfg.notes;
});

save.addEventListener("click", () => {
  chrome.storage.sync.set(
    {
      baseUrl: baseUrl.value.trim(),
      token: token.value.trim(),
      opportunityId: opportunityId.value.trim(),
      notes: notes.value,
    },
    () => {
      status.hidden = false;
      setTimeout(() => {
        status.hidden = true;
      }, 2000);
    },
  );
});
