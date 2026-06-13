const adminConfig = window.CAILY_ADMIN_CONFIG || {};
const form = document.querySelector("[data-admin-form]");
const message = document.querySelector("[data-admin-message]");
const statusNode = document.querySelector("[data-admin-status]");

const columns = [
  "id",
  "category",
  "featured",
  "name",
  "description",
  "detail",
  "specs",
  "price",
  "label",
  "image",
  "visible"
];

const setMessage = (text, type = "") => {
  message.textContent = text;
  message.dataset.type = type;
};

const getPayload = () => {
  const data = new FormData(form);
  return {
    token: adminConfig.adminToken || "",
    id: data.get("id").trim(),
    category: data.get("category"),
    featured: data.get("featured") ? "TRUE" : "FALSE",
    name: data.get("name").trim(),
    description: data.get("description").trim(),
    detail: data.get("detail").trim(),
    specs: data.get("specs").trim(),
    price: data.get("price").trim(),
    label: data.get("label").trim(),
    image: data.get("image").trim(),
    visible: data.get("visible") ? "TRUE" : "FALSE"
  };
};

const csvEscape = (value) => {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
};

const payloadToCsvLine = (payload) => columns.map((column) => csvEscape(payload[column])).join(",");

if (statusNode) {
  statusNode.textContent = adminConfig.appsScriptUrl
    ? "已設定 Apps Script，可以送出到 Google Sheet。"
    : "尚未設定 Apps Script。可以先用 CSV 複製功能。";
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = getPayload();

  if (!adminConfig.appsScriptUrl) {
    setMessage("尚未設定 Apps Script URL，請先用「複製成 CSV 列」貼到 Google Sheet。", "warn");
    return;
  }

  try {
    setMessage("送出中...");
    await fetch(adminConfig.appsScriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    setMessage("已送出。請到 Google Sheet 確認資料是否更新。", "success");
    form.reset();
    form.elements.visible.checked = true;
  } catch (error) {
    console.error(error);
    setMessage("送出失敗，請檢查 Apps Script URL 或網路連線。", "error");
  }
});

document.querySelector("[data-copy-csv]")?.addEventListener("click", async () => {
  const payload = getPayload();
  const csvLine = payloadToCsvLine(payload);

  try {
    await navigator.clipboard.writeText(csvLine);
    setMessage("已複製 CSV 列，可以貼到 Google Sheet 最下面。", "success");
  } catch {
    setMessage(csvLine, "warn");
  }
});
