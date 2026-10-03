# Copy ideas for connected grids

Every post gets one job (`role` in `copyPlan.posts`). Headline = the idea. Body = the proof, at most 1–2 lines. If a post needs more, split it.

**Length budget per post (1080px wide):** hook ≤ 8 words · headline ≤ 10 words · body ≤ 25 words. Vietnamese runs ~20–30% longer, so budget accordingly.

## Structures

### Carousel (`structure: "carousel"`)
| # | role | Job | Example |
|---|---|---|---|
| 1 | hook | Stop the scroll, promise a payoff | "I rebuilt our onboarding. Activation +41%." |
| 2 | problem | Name the pain in the reader's words | "Users signed up… then vanished on day 1." |
| 3 | insight | The non-obvious reframe | "They weren't confused. They were bored." |
| 4 | proof | Number, result, before/after, screenshot | "Day-1 retention: 22% → 31% in 3 weeks." |
| 5 | method | 3 steps / framework | "1. Cut 4 steps 2. Show value first 3. Ask later" |
| 6 | cta | Save / follow / comment prompt | "Save this for your next launch." |

### Product launch (`structure: "product-launch"`)
| # | role | Job | Example |
|---|---|---|---|
| 1 | promise | Coming soon / big promise | "Mornings, finally handled." |
| 2 | problem | The frustration it removes | "Five apps to plan one day?" |
| 3 | reveal | Product hero, name | "Meet Mira." |
| 4 | benefit | One benefit as an outcome | "Your whole day in one glance." |
| 5 | how | How to use, 3 steps | "Open · Swipe · Done." |
| 6 | cta | Where to get it | "Free on iOS — link in bio." |

### Educational (`structure: "educational"`)
| # | role | Job | Example |
|---|---|---|---|
| 1 | hook | Strong, specific hook | "5 mistakes React Native devs make" |
| 2 | mistake | Common mistake | "Re-rendering the whole list on every keystroke" |
| 3 | missed | What most people miss | "FlatList isn't slow. Your keyExtractor is." |
| 4 | framework | Simple model | "Measure → Memo → Virtualize" |
| 5 | example | Concrete example | "Before: 38fps. After: 60fps." |
| 6 | cta | Save / share | "Save this. Send it to your team." |

### Other useful structures
- **Before / After:** hook → before → turning point → after → how → CTA.
- **Timeline / story:** "2019" → "2021" → "2023" → "Today" → "Next" → CTA (template `timeline`).
- **Quote thread:** 1 quote per post, same author line, last post = source + CTA (template `quote-thread`).
- **Myth vs fact:** hook → myth 1 / fact 1 → myth 2 / fact 2 → … → CTA.
- **Puzzle grid (3×3):** top row = campaign headline across 3 posts; middle = product center + 2 benefit posts; bottom = proof, offer, CTA. Remember profile grids show the newest post top-left — use `export.order: "posting"`.

## Hook formulas
- **Number + outcome:** "3 changes that doubled our trial conversions"
- **Mistake:** "Stop doing X if you want Y"
- **Contrarian:** "X is overrated. Do Y instead."
- **Specific story:** "I spent $12k on ads before learning this"
- **Curiosity gap:** "The one setting every RN app should change"
- **Identity:** "If you sell on Shopee, read this"

## CTA bank
Save this for later · Send this to a friend who needs it · Follow for part 2 · Comment "GUIDE" and I'll send it · Link in bio · Shop now · Try it free

## Writing rules
- Concrete beats clever: numbers, names, places, timeframes.
- One idea per post; the next post should feel like the obvious next sentence.
- Write headlines to be read in 2 seconds; body copy to be read in 5.
- No hashtags or @mentions inside the image — put them in the caption (`copyPlan.caption`).
- Keep claims honest; no medical/financial promises in images.

---

## Tiếng Việt — hướng dẫn viết copy

### Nguyên tắc
- **Ngắn, cụ thể, có số:** "Thu hái ở độ cao 4.500m" tốt hơn "Chất lượng thượng hạng".
- **Một ý mỗi post.** Tiêu đề ≤ 10 từ, nội dung ≤ 25 từ.
- **Giọng thương hiệu:** sang trọng → "Tinh hoa", "tuyển chọn", "trao gửi"; gần gũi → "bạn", "mình", "thử ngay".
- **Xưng hô nhất quán** trong cả bộ (bạn / anh chị / quý khách) — không đổi giữa các post.
- **Tránh viết hoa toàn bộ** câu dài; dấu tiếng Việt khó đọc khi ALL CAPS.
- **Không lạm dụng** "SIÊU", "SỐC", "!!!", emoji trong ảnh.
- Kiểm tra chính tả dấu hỏi/ngã (khoẻ/khỏe — chọn một kiểu và dùng thống nhất).

### Cấu trúc ra mắt sản phẩm (VI)
| # | Vai trò | Ví dụ |
|---|---|---|
| 1 | Lời hứa | "Tinh hoa từ cao nguyên Tây Tạng" |
| 2 | Vấn đề | "Sức khoẻ là món quà lớn nhất" |
| 3 | Ra mắt | "Đông trùng hạ thảo Tây Tạng — Dương Gia" |
| 4 | Lợi ích | "Bồi bổ, phục hồi năng lượng mỗi ngày" |
| 5 | Cách dùng | "Hãm 3–5 sợi với nước ấm, uống mỗi sáng" |
| 6 | Kêu gọi | "Đặt hàng ngay — inbox để được tư vấn" |

### Cấu trúc chia sẻ kiến thức (VI)
1. Hook: "5 sai lầm khi chọn đông trùng hạ thảo"
2. Sai lầm phổ biến: "Chỉ nhìn giá, không hỏi nguồn gốc"
3. Điều ít ai biết: "Sợi to chưa chắc đã tốt"
4. Cách chọn: "Nhìn – Ngửi – Hỏi giấy tờ"
5. Ví dụ: "So sánh 2 mẫu thật"
6. CTA: "Lưu lại để dùng khi mua nhé!"

### Hook mẫu
- "Đừng mua ___ trước khi đọc bài này"
- "___ điều mình ước đã biết sớm hơn về ___"
- "Vì sao ___ lại đắt đến vậy?"
- "Quà biếu ___ — chọn sao cho tinh tế?"
- "3 phút mỗi sáng thay đổi ___"

### CTA mẫu
Đặt hàng ngay · Inbox để được tư vấn · Link ở bio · Lưu lại để dùng sau · Chia sẻ cho người thân · Gọi/Zalo: ___ · Ghé cửa hàng tại ___

### Caption (đặt trong `copyPlan.caption`, không đặt trong ảnh)
Dòng 1 = hook nhắc lại. 2–4 dòng giá trị. 1 dòng CTA. 3–5 hashtag cuối bài.
