# Sức Khỏe Tinh Thần

Build a Vietnamese-language web app called "Sàng lọc sức khỏe tinh thần sinh viên" — a mental-health screening tool for university students.

Critical design constraints

LIGHT MODE ONLY. Never implement dark mode. No dark backgrounds, no theme toggle, no prefers-color-scheme handling.

Page background: warm off-white #FAFAF8. Cards: pure white #FFFFFF with a soft 1px border #E8E6E1 and a very subtle shadow. Never use pure black — body text is #2B2B2B, secondary text #6B6B6B.

Accent colour: calm sage green #5B8C6E. Risk colours: low #5B8C6E, moderate #D89B4A, high #C4614F. Use these muted, desaturated tones, never bright red or alarm colours — this is a sensitive health topic and the UI must feel calm and reassuring, not clinical or alarming.

Font: Inter or system sans-serif. Generous whitespace, rounded corners (12px), no gradients, no glassmorphism, no animations beyond gentle fades.

Fully responsive; must work well on a phone.

All user-facing text in Vietnamese.

API

Base URL: lưu trong một biến cấu hình duy nhất, mặc định http://localhost:8000. Người dùng phải sửa được giá trị này ở một chỗ duy nhất trong mã.

GET /schema returns { fields: [...], disclaimer: "..." }. Each field has key, label, type (select | number | scale), group ("Thông tin chung" | "Học tập" | "Đời sống"), plus options for selects and min/max/default/hint for numbers and scales. Build the form dynamically from this endpoint — do not hardcode the questions.

POST /predict takes all field keys as a flat JSON object plus optional capacity_pct, and returns:

json

{
  "percent": 99.5,
  "risk_level": "low" | "moderate" | "high",
  "risk_label": "Cao",
  "model_used": "catboost" | "logistic",
  "model_reason": "Dữ liệu đầy đủ",
  "n_missing": 0,
  "recommendation": "…",
  "contributions": [
    { "feature": "Áp lực học tập", "contribution": 1.388, "direction": "increase", "text": "…" }
  ],
  "disclaimer": "…"
}

Every field may be sent as null — the API fills in medians and automatically switches to a more robust model when three or more fields are missing. Therefore let users skip any question via a small "Bỏ qua câu này" link beneath each field, and send null for skipped ones.

Screens

1. Landing. Centred card. Heading "Sàng lọc sức khỏe tinh thần". One short paragraph: this is a reference screening tool using a machine-learning model, it takes about two minutes, answers are not stored anywhere. Primary button "Bắt đầu". Below the button, a quiet grey note stating this does not replace a diagnosis by a mental-health professional.

2. Questionnaire. Three steps matching the three group values, with a slim progress bar. Render scale fields as a horizontal row of numbered buttons (1–5 or 0–12) where the selected one fills with the sage accent — not a slider. Render select fields as large tappable option cards, not a native dropdown. Show each field's hint in small grey text beneath its label. "Quay lại" and "Tiếp tục" buttons; disable "Tiếp tục" until every field on the step is answered.

3. Result.

A large circular progress ring showing percent, coloured by risk_level. Animate it counting up from 0 over about 800ms.

Below it: "Mức nguy cơ: {risk_label}" and the recommendation text in a soft tinted panel matching the risk colour at about 8% opacity.

Then a section headed "Vì sao có kết quả này". For each item in contributions, render a horizontal diverging bar: bars extend right in #C4614F when direction is "increase" and left in #5B8C6E when "decrease", with the feature name on the left and the text beneath. Scale bar widths relative to the largest absolute contribution.

A short explanatory line: results come from a model trained on 27,901 records and reflect statistical association, not causation.

The disclaimer string in a bordered grey box at the bottom, always visible.

If risk_level is "high", show a prominent but gentle sage-bordered card above the disclaimer with the heading "Bạn không phải đối mặt với điều này một mình" and placeholder contact details for the university counselling office.

Buttons: "Làm lại" and "Tải kết quả" (client-side PDF or PNG of the result card).

4. Admin page at /quan-tri. Fetch GET /thresholds and show the capacity table (capacity_pct, threshold, precision, recall) as a clean table. Above it, a slider letting the user pick a capacity percentage; display the matching threshold and a sentence such as "Với năng lực mời 10% sinh viên, khoảng 96,8% số người được mời thực sự thuộc nhóm nguy cơ." No login required.

Behaviour

Show a skeleton loader while /schema loads and a calm spinner on submit. If a request fails to connect, show "Không kết nối được máy chủ. Hãy kiểm tra API đã chạy chưa." with a "Thử lại" button.

On network error, show a friendly Vietnamese message with a "Thử lại" button. Never show a raw stack trace.

Do not use localStorage or any persistence. Keep all state in memory and clear it on "Làm lại".

Never display the raw probability to more than one decimal place, and never label anyone as "bị trầm cảm" — always phrase results as "mức nguy cơ".

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/22cf2d70-11f1-4f33-bc3b-b28996d1ccb8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
