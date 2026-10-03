# Vietnamese brand campaign

**For:** Vietnamese social commerce and local brands — đặc sản, quà biếu, Tết, mỹ phẩm, thực phẩm chức năng, F&B, nông sản OCOP.
**Feeling:** trang trọng nhưng gần gũi — elegant but approachable, readable at a glance in the Facebook/Threads/Zalo feed.

## Palette (pick one family)
- **Đỏ – vàng (Tết, quà biếu):** red #9e1b1b, deep red #5c1010, gold #d9a441 on warm cream #fbf3e6.
- **Xanh ngọc – champagne (thảo dược, đông trùng, trà):** jade #1f4d3a, #2f6650, champagne #c9a96e on ivory #f6f1e4.
- **Nâu – kem (cà phê, bánh, thủ công):** coffee #4a2c1d, caramel #b9783f on cream #f5ece0.
Always respect the brand's own colors first.

## Type
- `be-vietnam` for everything is the safe default (designed for Vietnamese). Headlines 700–800, line-height ≥ 1.15 so dấu (ầ, ẫ, ợ) never collide.
- For premium: `lora` or `playfair` headings + `be-vietnam` body. Avoid `cormorant` below 56px for Vietnamese (thin diacritics).
- Avoid all-caps on long Vietnamese headlines; ok for ≤ 3-word labels with 0.08em tracking.

## Composition
- Product hero big and clear (customers want to see the box/jar), on a soft `arch` or `ellipse`, with shadow.
- Signature move: the product sits on seam 1|2 (template `product-hero-split`), a gold line runs through every post, the brand name/logo is on post 1 and the CTA post.
- Each post: one benefit, short and concrete ("Thu hái ở độ cao 4.500m" beats "Chất lượng cao").
- CTA post: clear action + channel: "Đặt hàng ngay", "Inbox để được tư vấn", "Link ở bio", hotline/Zalo if the user gives one.
- Trust markers welcome on one post: chứng nhận, OCOP, nguồn gốc, số năm thương hiệu — as a clean row of small `badge`s, not stickers.

## Avoid
Sale-sticker overload ("SALE SỐC!!!"), > 2 fonts, red text on green, tiny diacritics, stretched product photos, AI-looking stock imagery.

## Recommended setup
`style: vietnamese-brand-campaign` · template `product-hero-split` or `puzzle-grid` · 6 square posts (or 3×3 for fanpage campaigns).
