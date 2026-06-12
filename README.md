# 凱莉日嚐網站

這是一個純前端靜態網站，可以直接用瀏覽器打開 `index.html`。

## 頁面

- `index.html`：首頁，自動輪播照片集與今日推薦商品
- `limited.html`：限時蛋糕
- `birthday.html`：生日蛋糕
- `desserts.html`：蛋糕點心入口
- `tarts.html`：6吋塔
- `rolls.html`：長條捲
- `about.html`：關於我們
- `cart.html`：購物車

## 更新商品與照片

商品資料集中在 `assets/js/products.js`。

把新照片放到 `assets/photos/` 後，在商品資料裡修改：

```js
image: "assets/photos/my-new-cake.jpg"
```

首頁「今日推薦」會顯示 `featured: true` 的商品，最多取前 4 個。

## 購物車

購物車使用瀏覽器的 `localStorage` 暫存商品，不需要後端伺服器。
如果換瀏覽器或清除瀏覽資料，購物車內容會消失。

## Logo 與付款方式

- Logo：`assets/images/caily-logo.png`
- 付款方式圖片：`assets/images/payment-methods.png`
