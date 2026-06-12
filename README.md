# 凱莉日嚐網站

這是一個純前端靜態網站，已支援用 Google Sheet 管理商品。

## 頁面

- `index.html`：首頁，自動輪播照片集與今日推薦商品
- `limited.html`：限時蛋糕
- `birthday.html`：生日蛋糕
- `desserts.html`：蛋糕點心入口
- `tarts.html`：6吋塔
- `rolls.html`：長條捲
- `cat-schedule.html`：貓咪班表
- `about.html`：關於我們
- `cart.html`：購物車

## 老闆娘更新商品的方式

建議用 Google Sheet 管商品。範本在：

`google-sheet-template.csv`

把這個 CSV 匯入 Google Sheet，欄位不要改名。

### 欄位說明

- `id`：商品唯一代號，例如 `limited-fruit`，不要重複
- `category`：分類，只能填 `limited`、`birthday`、`tarts`、`rolls`
- `featured`：是否顯示在首頁今日推薦，填 `TRUE` 或 `FALSE`
- `name`：商品名稱
- `description`：商品卡片短介紹
- `detail`：商品詳細頁介紹
- `specs`：商品規格，用 `｜` 分隔每一條
- `price`：價格，只填數字
- `label`：標籤，例如 新品、生日推薦、6吋塔
- `image`：圖片路徑或圖片網址
- `visible`：是否顯示，填 `TRUE` 或 `FALSE`

## 連接 Google Sheet

1. 在 Google Sheet 建好商品表。
2. 點 `檔案` -> `共用` -> `發布到網路`。
3. 選目前工作表，格式選 `逗號分隔值 (.csv)`。
4. 複製發布網址。
5. 打開 `assets/js/config.js`。
6. 把網址貼到 `productsCsvUrl`：

```js
window.CAILY_CONFIG = {
  productsCsvUrl: "貼上 Google Sheet CSV 網址"
};
```

如果 `productsCsvUrl` 是空字串，網站會使用 `assets/js/products.js` 裡的備援商品資料。

## 圖片怎麼放

如果圖片放在網站內：

- 商品照片放到 `assets/photos/`
- Google Sheet 的 `image` 填：

```text
assets/photos/my-new-cake.jpg
```

如果圖片放雲端圖床：

- Google Sheet 的 `image` 直接填完整圖片網址。

```text
https://example.com/my-new-cake.jpg
```

## 購物車

購物車使用瀏覽器的 `localStorage` 暫存商品，不需要後端伺服器。
如果換瀏覽器或清除瀏覽資料，購物車內容會消失。

## Logo 與背景

- Logo：`assets/images/caily-logo.png`
- 付款方式圖片：`assets/images/payment-methods.png`
- 店面素描背景：`assets/images/storefront-sketch.png`
