@AGENTS.md

# HCMC High School Navigator — Tài liệu kiến trúc

## Tổng quan

Ứng dụng tư vấn tuyển sinh lớp 10 công lập TP.HCM. Học sinh nhập điểm thi, nhận danh sách trường + ban học phù hợp, xem điểm chuẩn lịch sử và khoảng cách từ nhà.

**Stack:** Next.js 15 (App Router) · Supabase (PostgreSQL + RLS) · TanStack Query v5 · shadcn/ui · Tailwind v4 · Zod v4 · react-hook-form

---

## Cấu trúc thư mục

```
src/
  app/
    page.tsx                  — Homepage hero + features
    recommend/page.tsx        — Trang tư vấn (form + bảng kết quả)
    schools/page.tsx          — Danh sách trường (grid cards)
    schools/[id]/page.tsx     — Chi tiết trường (tabs: điểm chuẩn / bản đồ / đánh giá)
    admin/page.tsx            — Bảng quản trị (tabs: Trường / Ban / Điểm / Import)
    api/
      admin/schools/          — POST tạo trường mới
      admin/programs/         — POST tạo ban học
      admin/cutoffs/          — POST thêm điểm chuẩn
      admin/geocode/          — GET proxy Nominatim (cần x-admin-secret header)
      admin/import/           — POST bulk import CSV (điểm chuẩn / đánh giá)
      programs/               — GET danh sách programs với latest cutoff (cho recommend)
      recommend/              — POST tính toán gợi ý (server-side)
      schools/                — GET danh sách trường
      schools/[id]/           — GET chi tiết 1 trường
      ai/summary/             — POST tóm tắt đánh giá bằng AI
  components/
    admin/
      add-school-form.tsx     — Form thêm trường + geocode tự động
      add-program-form.tsx    — Form thêm ban học
      add-cutoff-form.tsx     — Form thêm điểm chuẩn
      bulk-school-import.tsx  — Import hàng loạt từ CSV hoặc paste text
      csv-import.tsx          — Import điểm chuẩn / đánh giá từ CSV
      admin-guard.tsx         — Kiểm tra ADMIN_SECRET trước khi render admin UI
    recommendation/
      recommendation-form.tsx — Form nhập điểm thi (sidebar sticky)
      recommendation-table.tsx — Bảng kết quả + filter + sort
    school/
      cutoff-chart.tsx        — Biểu đồ điểm chuẩn theo năm (recharts)
      ai-summary.tsx          — Card tóm tắt AI (pros/cons/student_opinions)
    shared/
      navbar.tsx
      chance-badge.tsx        — Badge: Cao / Trung bình / Thấp
      program-badge.tsx       — Badge: Thường / Chuyên / Tích hợp
      providers.tsx           — QueryClientProvider wrapper
  hooks/
    use-recommendation.ts     — useMutation → POST /api/recommend
    use-schools.ts            — useQuery → GET /api/schools (+ useSchool cho detail)
  lib/
    recommendation.ts         — Logic tính điểm + gợi ý (pure, không gọi DB)
    supabase/client.ts        — createBrowserClient
    supabase/server.ts        — createServerClient + createServiceClient (admin)
    query-client.ts           — Singleton QueryClient
  types/index.ts              — Tất cả TypeScript types
```

---

## Data Model (Supabase)

```
schools          id, name, type(PUBLIC), address, district, latitude, longitude, website, description
programs         id, school_id, name, type(SPECIALIZED|INTEGRATED|NORMAL)
cutoffs          id, program_id, year, cutoff_score   ← unique(program_id, year)
reviews          id, school_id, source, content
```

**View quan trọng:** `program_latest_cutoff` — join programs + latest cutoff per program, dùng cho recommend API.

---

## Scoring Logic (`src/lib/recommendation.ts`)

```
NORMAL:      total = toan + van + ngoai_ngu                  (max 30)
SPECIALIZED: total = toan + van + ngoai_ngu + 2 × chuyen     (max 50)
INTEGRATED:  total = toan + van + ngoai_ngu + 2 × tich_hop   (max 50)

Xác suất đậu:
  diff = total - cutoff_score
  diff >= 1.5  → HIGH
  diff >= 0    → MEDIUM
  diff <  0    → LOW
```

**`programMatchesSubject()`** — filter SPECIALIZED programs theo môn chuyên đã chọn.
- "Chuyên Anh" KHÔNG match "Chuyên Anh (Đề án 5695)" (đó là INTEGRATED, đã bỏ khỏi GIFTED_SUBJECTS)
- Rule: nếu subject không chứa "đề án"/"5695" thì bỏ programs có chứa "đề án"/"5695"

---

## Các Pattern Quan Trọng

### 1. Admin authentication
Tất cả admin API đọc header `x-admin-secret` so với `process.env.ADMIN_SECRET`. Không dùng session/cookie. `AdminGuard` component hỏi mật khẩu ở client, truyền xuống qua prop `secret`.

### 2. Supabase clients
- `createServiceClient()` — dùng trong admin API routes (bypass RLS)
- `createServerClient()` — dùng trong server components/API routes thông thường
- `createBrowserClient()` — dùng trong client components

### 3. Form pattern
- Tất cả numeric fields dùng `z.string()` trong schema, parse manual bằng `parseFloat()`
- Không dùng `z.number()` vì HTML input luôn trả về string

### 4. React Query
- `useSchools()`, `useSchool(id)` → GET queries, stale time tự động
- `useRecommendation()` → useMutation, kết quả set vào local state bằng `onSuccess`

### 5. Nominatim geocoding
- Server-side proxy tại `/api/admin/geocode`
- Rate limit: 1 req/sec → sleep 1100ms giữa các rows trong bulk import
- Query: `address + district + "Thành phố Hồ Chí Minh, Việt Nam"`
- User-Agent bắt buộc: `HCMCHighSchoolNavigator/1.0 (nguyentruongmanhquan@gmail.com)`

### 6. CSV/Paste import (`bulk-school-import.tsx`)
- Validate `result.meta.fields` phải có `name, address, district` trước khi xử lý
- Nếu geocode thất bại → insert với `latitude: null, longitude: null`, KHÔNG bỏ qua row
- Template: `name, address, district, website, description`

### 7. shadcn/ui Tailwind v4
- SelectContent cần `bg-white` class để tránh background trong suốt trên một số browsers
- Dùng `cn()` từ `@/lib/utils` cho conditional classes

### 8. Recommendation filter & sort (`recommendation-table.tsx`)
- Filter: tìm kiếm text, loại ban (ALL/SPECIALIZED/INTEGRATED/NORMAL), xác suất (ALL/HIGH/MEDIUM/LOW)
- Sort: điểm chuẩn / chênh lệch / khoảng cách — click header để toggle asc/desc
- School name là Link trực tiếp đến `/schools/:id`, không có cột action riêng

---

## Dữ liệu đã có (tính đến 2026-06-28)

- **Trường:** ~110 trường công lập TP.HCM (tất cả đều type=PUBLIC)
- **Điểm chuẩn THƯỜNG:** 2023–2025 cho ~108 trường
- **Điểm chuẩn CHUYÊN:** 2025 cho THPT Chuyên Trần Đại Nghĩa + THPT Chuyên Lê Hồng Phong
- **Điểm chuẩn TÍCH HỢP:** 2025 cho 10 trường (THPT Bùi Thị Xuân, Gia Định, Lương Thế Vinh, v.v.)
- **Chưa có:** Điểm chuẩn THPT Chuyên Hùng Vương, THPT Chuyên Lê Quý Đôn; Song ngữ Tiếng Pháp; năm 2026

---

## Môn chuyên hợp lệ (`GIFTED_SUBJECTS` trong recommendation-form.tsx)

Chuyên Anh, Chuyên Địa, Chuyên Hóa, Chuyên Lý, Chuyên Nhật, Chuyên Pháp, Chuyên Sinh, Chuyên Sử, Chuyên Tin, Chuyên Toán, Chuyên Trung, Chuyên Văn

> "Chuyên Anh (Đề án 5695)" đã bỏ khỏi đây — nó là INTEGRATED, không phải SPECIALIZED.

---

## Commit message format

`[category] short english description`

Categories: `ui`, `fix`, `feature`, `data`, `docs`, `refactor`, `perf`

Ví dụ:
- `[ui] Replace "Đại trà" with "Thường" in score preview label`
- `[fix] Geocode failure no longer skips bulk import row`
- `[data] Add 2023-2025 normal school cutoff scores`
