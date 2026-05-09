# Annie Blog - 開發進度

## 資料庫結構
- [x] 建立 posts 表（id, title, content, createdAt, updatedAt, authorId）
- [x] 建立 post_images 表（id, postId, imageUrl, imageKey, order）
- [x] 建立 post_tags 表（id, postId, tag）
- [x] 執行資料庫遷移

## 後端 API
- [x] 實現 posts.list 查詢（支援 tag 篩選）
- [x] 實現 posts.getById 查詢
- [x] 實現 posts.create 新增文章（需認證）
- [x] 實現 posts.update 編輯文章（需認證）
- [x] 實現 posts.delete 刪除文章（需認證）
- [x] 實現 images.upload 上傳圖片（需認證）
- [x] 實現 tags.list 列出所有標籤

## 前端首頁
- [x] 設計極簡白底風格的首頁佈局
- [x] 實現文章列表展示（依發布時間倒序）
- [x] 實現 HashTag 顯示與點擊篩選功能
- [x] 實現標籤篩選後的文章列表更新
- [x] 添加導航到文章詳細頁面

## 文章詳細頁面
- [x] 實現文章詳細頁面佈局
- [x] 顯示文章完整內容、所有圖片、標籤
- [x] 實現返回首頁導航

## 後台管理介面
- [x] 設計後台管理佈局（需登入驗證）
- [x] 實現文章新增表單（支援多張圖片上傳、標籤輸入）
- [x] 實現文章編輯表單
- [x] 實現文章刪除功能（含確認對話框）
- [x] 實現後台文章列表管理

## 測試與優化
- [x] 編寫 vitest 單元測試（後端 API）
- [x] 測試所有 CRUD 操作
- [x] 測試標籤篩選功能
- [x] 修正 HashTag 篩選流程（首頁讀取 URL 參數）
- [x] 修正後台圖片上傳流程（先建立文章再上傳）
- [x] 測試標籤篩選功能（posts.list with tag filter）

## 部署與交付
- [x] 建立檢查點
- [x] 驗證網址包含 "annie" 字樣（專案名稱 annie-blog）
- [x] 向使用者展示成果

## Bug 修復
- [x] 修正刪除權限 Bug：允許 admin 刪除任何文章（第 193-196 行 server/routers.ts）

## UI 改進
- [x] 將 hashtag 標籤區塊移到右側邊欄，避免標籤過多時影響文章列表版面
- [x] 調整標題區和文章區的左邊界對齊

## 新功能
- [x] 添加 Markdown 支援：在後台編輯時支援 Markdown 語法，前台自動渲染

## Bug 修複
- [x] 修複網站標題設定：使用環境變數 VITE_APP_TITLE 動態設定標題，使後台設定的標題能正確同步到前台

## 待车
- [x] 修改副標題：從「A personal collection of thoughts and moments」改為「A collection of thoughts and moments」

## Bug 修複
- [x] 修複 iostream 標籤错誤：修改首頁和作者頁的文章預覽為純文字，不用 Streamdown 渲染截斷的 Markdown


## 新功能
- [x] 按日期篤選文章：支援 /YYYY/MM 路由顯示特定年月的所有文章

## 待车
- [x] 在首頁 header 添加登出按鈕，位置在 New Post 按鈕右邊


## Bug 待修複
- [x] 修複 Clear Filter 按鈕不的效的問題

- [x] 修複首頁標題和文章預覽的左邊界對齊問題

- [x] 修複文章詳細頁標題和內文的左邊界對齊問題

- [x] 調整文章詳細頁左邊距，使其與首頁文章預覽的左邊界對齊


## 新功能
- [x] 添加標籤頁面 (/tags)：顯示所有標籤，點擊標籤可篤選文章

- [x] 在手機版隱藏 TAGS 欄位，只在電腦版顯示

- [x] 調整手機版 header：「New Post」和「Sign Out」按鈕改為只顯示圖示，並垂直排列，不會擦圧標題

- [x] 手機版登出後「Sign In」按鈕改為只顯示圖示，不會擦圧標題副標題

- [x] 將手機版 Sign In 按鈕圖示改為 User 圖示


## 新功能
- [x] 文章詳細頁添加右侧邊欄：登入用戶顯示「Your Posts」，未登入用戶顯示「Popular Posts」，手機版隱藏


## 待改進
- [x] 文章詳細頁右側邊欄：為「Your Posts」和「Popular Posts」添加 loading / error / empty states UI
- [x] 實作真正的「Popular Posts」排序邏輯（按 viewCount 降序排序，每次查看文章時自動增加計數）


## 圖片區塊調整
- [x] 移除圖片區塊的「Images」標籤
- [x] 修正圖片顯示不完整問題（上下裁剪，改用 object-contain）
- [x] 將圖片區塊放大至原本的 1.7 倍，向右下方擴展（使用 CSS transform: scale(1.7)）


## 首頁預覽圖片調整
- [x] 縮減首頁預覽圖片大小至現在的 40%（使用 height: 240px 和 maxHeight: 40vh）
- [x] 修正首頁預覽圖片上下不完整的裁剪問題（改用 object-contain）


## 首頁預覽圖片對齊調整
- [x] 調整首頁預覽圖片向左對齊，與文章左侧在同一條線上（使用 width: fit-content）


## 作者頁面圖片調整
- [x] 調整作者頁面的圖片預覽，縮小至 40%（與首頁一致）
- [x] 調整作者頁面的圖片預覽向左對齊（與首頁一致）


## 圖片預覽組件化
- [x] 建立 PostPreviewImage 可重用組件
- [x] 重構首頁使用 PostPreviewImage 組件
- [x] 重構作者頁面使用 PostPreviewImage 組件
- [x] 重構月份存檔頁面使用 PostPreviewImage 組件
- [x] 標籤頁面目前只顯示標籤列表，不需要修改


## Bug 修復
- [x] 修復 MonthArchive 頁面圖片無法顯示（屬性名稱從 url 改為 imageUrl）
