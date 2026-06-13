const adminConfig = window.CAILY_ADMIN_CONFIG || {};
const form = document.querySelector("[data-admin-form]");
const message = document.querySelector("[data-admin-message]");
const statusNode = document.querySelector("[data-admin-status]");
const deleteIdInput = document.querySelector("[data-delete-id]");

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
  if (!message) return;
  message.textContent = text;
  message.dataset.type = type;
};

const getPayload = () => {
  const data = new FormData(form);
  return {
    token: adminConfig.adminToken || "",
    action: "upsert",
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

const postToAdminScript = async (payload) => {
  await fetch(adminConfig.appsScriptUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
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
    : "尚未設定 Apps Script。你仍可使用「複製 CSV 文字」手動貼到 Google Sheet。";
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = getPayload();

  if (!adminConfig.appsScriptUrl) {
    setMessage("尚未設定 Apps Script URL，請先複製 CSV 文字手動貼到 Google Sheet。", "warn");
    return;
  }

  try {
    setMessage("送出中...");
    await postToAdminScript(payload);
    setMessage("已送出到 Google Sheet。請稍等幾秒後重新整理網站確認。", "success");
    form.reset();
    form.elements.visible.checked = true;
  } catch (error) {
    console.error(error);
    setMessage("送出失敗，請檢查 Apps Script URL 與網路狀態。", "error");
  }
});

document.querySelector("[data-delete-product]")?.addEventListener("click", async () => {
  const id = deleteIdInput.value.trim();
  if (!id) {
    setMessage("請先輸入要刪除的商品 ID。", "warn");
    return;
  }

  if (!adminConfig.appsScriptUrl) {
    setMessage("尚未設定 Apps Script URL，無法直接刪除。請到 Google Sheet 手動刪除該列。", "warn");
    return;
  }

  const confirmed = window.confirm(`確定要刪除商品「${id}」嗎？`);
  if (!confirmed) return;

  try {
    setMessage("刪除中...");
    await postToAdminScript({
      token: adminConfig.adminToken || "",
      action: "delete",
      id
    });
    setMessage("已送出刪除要求到 Google Sheet。請稍等幾秒後重新整理網站確認。", "success");
    deleteIdInput.value = "";
  } catch (error) {
    console.error(error);
    setMessage("刪除失敗，請檢查 Apps Script URL 與網路狀態。", "error");
  }
});

document.querySelector("[data-copy-csv]")?.addEventListener("click", async () => {
  const payload = getPayload();
  const csvLine = payloadToCsvLine(payload);

  try {
    await navigator.clipboard.writeText(csvLine);
    setMessage("已複製 CSV 文字，可以貼到 Google Sheet。", "success");
  } catch {
    setMessage(csvLine, "warn");
  }
});
