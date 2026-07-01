-- ============================================================
-- 004_2026_school_data.sql
-- Adds 5 new HCM schools, their NORMAL programs, and
-- 2026 NV1 cutoff scores for all 112 HCM public schools.
--
-- Depends on: 003_make_address_nullable.sql
-- Safe to re-run: uses WHERE NOT EXISTS + ON CONFLICT
-- ============================================================


-- ── PART 1: Insert 5 new HCM schools ─────────────────────────────────
INSERT INTO schools (name, type, district, latitude, longitude)
SELECT v.name, v.type, v.district, v.lat, v.lng
FROM (VALUES
  ('Trường Trung học Thực hành ĐHSP', 'PUBLIC', 'Quận 5', NULL, NULL)
  ('Dự án THPT Phường Đông Hưng Thuận', 'PUBLIC', 'Quận 12', 10.8431, 106.6259)
  ('Dự án Tiểu học, THCS và THPT Phường Thới An', 'PUBLIC', 'Quận 12', 10.8684, 106.6522)
  ('Dự án THPT Phường Tân Phú', 'PUBLIC', 'Quận Tân Phú', NULL, NULL)
  ('THPT Vĩnh Lộc', 'PUBLIC', 'Quận Bình Tân', 10.8099, 106.5921)
) AS v(name, type, district, lat, lng)
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name = v.name);


-- ── PART 2: Insert NORMAL program for each new school ────────────────
INSERT INTO programs (school_id, name, type)
SELECT s.id, 'Thường', 'NORMAL'
FROM schools s
WHERE s.name IN (
  'Trường Trung học Thực hành ĐHSP',
  'Dự án THPT Phường Đông Hưng Thuận',
  'Dự án Tiểu học, THCS và THPT Phường Thới An',
  'Dự án THPT Phường Tân Phú',
  'THPT Vĩnh Lộc'
)
AND NOT EXISTS (
  SELECT 1 FROM programs p WHERE p.school_id = s.id AND p.type = 'NORMAL'
);


-- ── PART 3: Insert 2026 NV1 cutoff scores (112 HCM schools) ──────────
WITH school_scores(school_name, score) AS (
  VALUES
  ('THPT Trưng Vương', 21.75)
  ('THPT Bùi Thị Xuân', 24.25)
  ('THPT Ten Lơ Man', 20.5)
  ('THPT Năng khiếu TDTT', 14.0)
  ('THCS-THPT Trần Đại Nghĩa', 24.0)
  ('THPT Lương Thế Vinh', 22.75)
  ('THPT Giồng Ông Tố', 18.75)
  ('THPT Thủ Thiêm', 14.25)
  ('THPT Lê Quý Đôn', 23.75)
  ('THPT Nguyễn Thị Minh Khai', 24.5)
  ('THPT Lê Thị Hồng Gấm', 14.25)
  ('THPT Marie Curie', 22.25)
  ('THPT Nguyễn Thị Diệu', 15.75)
  ('THPT Nguyễn Trãi', 15.25)
  ('THPT Nguyễn Hữu Thọ', 18.25)
  ('Trường Trung học Thực hành Sài Gòn', 23.5)
  ('THPT Hùng Vương', 21.0)
  ('Trường Trung học Thực hành ĐHSP', 24.5)
  ('THPT Trần Khai Nguyên', 23.0)
  ('THPT Trần Hữu Trang', 14.0)
  ('THPT Mạc Đĩnh Chi', 24.25)
  ('THPT Bình Phú', 22.5)
  ('THPT Nguyễn Tất Thành', 19.75)
  ('THPT Phạm Phú Thứ', 17.0)
  ('THPT Lê Thánh Tôn', 20.0)
  ('THPT Tân Phong', 15.75)
  ('THPT Ngô Quyền', 21.25)
  ('THPT Nam Sài Gòn', 22.25)
  ('THPT Lương Văn Can', 15.75)
  ('THPT Ngô Gia Tự', 13.25)
  ('THPT Tạ Quang Bửu', 18.0)
  ('THPT Nguyễn Văn Linh', 11.75)
  ('THPT Võ Văn Kiệt', 18.0)
  ('THPT Chuyên Năng khiếu TDTT Nguyễn Thị Định', 14.5)
  ('THPT Nguyễn Huệ', 18.5)
  ('THPT Phước Long', 19.25)
  ('THPT Long Trường', 12.5)
  ('THPT Nguyễn Văn Tăng', 12.0)
  ('THPT Dương Văn Thì', 16.5)
  ('THPT Nguyễn Khuyến', 20.75)
  ('THPT Nguyễn Du', 21.75)
  ('THPT Nguyễn An Ninh', 16.25)
  ('THCS-THPT Diên Hồng', 15.0)
  ('THCS-THPT Sương Nguyệt Anh', 13.5)
  ('THPT Nguyễn Hiền', 19.75)
  ('THPT Trần Quang Khải', 17.75)
  ('THPT Nam Kỳ Khởi Nghĩa', 16.5)
  ('THPT Võ Trường Toản', 22.5)
  ('THPT Trường Chinh', 19.25)
  ('Dự án THPT Phường Đông Hưng Thuận', 16.0)
  ('Dự án Tiểu học, THCS và THPT Phường Thới An', 16.25)
  ('THPT Thạnh Lộc', 17.5)
  ('THPT Thanh Đa', 16.25)
  ('THPT Võ Thị Sáu', 21.0)
  ('THPT Gia Định', 23.5)
  ('THPT Phan Đăng Lưu', 17.5)
  ('THPT Trần Văn Giàu', 18.0)
  ('THPT Hoàng Hoa Thám', 20.75)
  ('THPT Gò Vấp', 18.0)
  ('THPT Nguyễn Công Trứ', 22.0)
  ('THPT Trần Hưng Đạo', 22.25)
  ('THPT Nguyễn Trung Trực', 19.75)
  ('THPT Phú Nhuận', 24.0)
  ('THPT Hàn Thuyên', 16.25)
  ('THPT Tân Bình', 21.5)
  ('THPT Nguyễn Chí Thanh', 20.25)
  ('THPT Trần Phú', 24.25)
  ('THPT Nguyễn Thượng Hiền', 24.75)
  ('THPT Nguyễn Thái Bình', 18.75)
  ('THPT Nguyễn Hữu Huân', 24.25)
  ('THPT Thủ Đức', 22.75)
  ('THPT Tam Phú', 20.0)
  ('THPT Hiệp Bình', 16.75)
  ('THPT Đào Sơn Tây', 14.75)
  ('THPT Linh Trung', 16.25)
  ('THPT Bình Chiêu', 15.75)
  ('THPT Bình Chánh', 14.25)
  ('THPT Tân Túc', 12.75)
  ('THPT Vĩnh Lộc B', 16.25)
  ('THPT Năng khiếu TDTT Bình Chánh', 13.5)
  ('THPT Phong Phú', 10.75)
  ('THPT Lê Minh Xuân', 14.25)
  ('THPT Đa Phước', 10.5)
  ('THPT Bình Khánh', 10.0)
  ('THPT Cần Thạnh', 9.0)
  ('THPT An Nghĩa', 10.0)
  ('THPT Củ Chi', 16.0)
  ('THPT Quang Trung', 12.25)
  ('THPT An Nhơn Tây', 11.5)
  ('THPT Trung Phú', 16.25)
  ('THPT Trung Lập', 10.5)
  ('THPT Phú Hòa', 13.5)
  ('THPT Tân Thông Hội', 14.75)
  ('THPT Nguyễn Hữu Cầu', 24.0)
  ('THPT Lý Thường Kiệt', 20.75)
  ('THPT Bà Điểm', 20.5)
  ('THPT Nguyễn Văn Cừ', 15.5)
  ('THPT Nguyễn Hữu Tiến', 19.0)
  ('THPT Phạm Văn Sáng', 17.5)
  ('THPT Hồ Thị Bi', 17.25)
  ('THPT Long Thới', 13.25)
  ('THPT Phước Kiển', 11.75)
  ('THPT Dương Văn Dương', 13.25)
  ('THPT Tây Thạnh', 23.25)
  ('THPT Lê Trọng Tấn', 21.75)
  ('Dự án THPT Phường Tân Phú', 16.25)
  ('THPT Vĩnh Lộc', 19.0)
  ('THPT Nguyễn Hữu Cảnh', 21.0)
  ('THPT Bình Hưng Hòa', 19.75)
  ('THPT Bình Tân', 16.0)
  ('THPT Bình Trị Đông B (THPT Hoàng Thế Thiện)', 15.5)
  ('THPT An Lạc', 17.25)
)
INSERT INTO cutoffs (program_id, year, cutoff_score)
SELECT p.id, 2026, ss.score
FROM school_scores ss
JOIN schools  s ON s.name  = ss.school_name
JOIN programs p ON p.school_id = s.id AND p.type = 'NORMAL'
ON CONFLICT (program_id, year)
  DO UPDATE SET cutoff_score = EXCLUDED.cutoff_score;
