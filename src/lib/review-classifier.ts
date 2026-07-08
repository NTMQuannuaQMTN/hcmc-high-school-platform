// Training examples — add new labeled samples here to refine the classifier
export const TRAINING_DATA: { text: string; label: 'review' | 'not_review'; reason: string }[] = [
  {
    text: 'Tân học sinh lớp 10 Trường THPT chuyên Trần Đại Nghĩa vừa trải nghiệm các hoạt động học tập chuyên sâu, vừa hòa mình vào màn ra mắt ấn tượng của 22 câu lạc bộ và dự án.',
    label: 'not_review',
    reason: 'news report about school event — third-person, "vừa" signals recency news',
  },
  {
    text: 'Với các bạn cấp 1 học công, cấp 2 vẫn dự định học công thì Trường chuyên Trần Đại Nghĩa là lựa chọn tốt nhất. Lí do là môi trường thầy cô, bạn bè, chương trình hoạt động năng khiếu, cơ sở vật chất... gần như đều hơn hẳn các trường công cấp 2 ở TP.HCM.',
    label: 'review',
    reason: 'personal recommendation with specific aspects and comparative opinion ("đều hơn hẳn")',
  },
  {
    text: 'TTO - Một số phụ huynh học sinh lớp 9 Trường THPT chuyên Trần Đại Nghĩa, TP.HCM bức xúc về những thiệt thòi khi con em họ tham gia xét tuyển vào lớp 10.',
    label: 'not_review',
    reason: 'newspaper article (TTO = Tuổi Trẻ Online) — "Một số phụ huynh" is third-person journalism',
  },
  {
    text: 'Review chi tiết về THPT chuyên Trần Đại Nghĩa. Nhận xét từ sinh viên và học giả. Về các thông tin chất lượng giảng dạy, môi trường, cơ sở vật chất, và cơ hội nghề nghiệp...',
    label: 'not_review',
    reason: 'page meta-description for a review aggregator — no actual opinion content',
  },
  {
    text: 'Khám phá thông tin cần biết về Trường THPT Chuyên Trần Đại Nghĩa từ quy định, cơ sở vật chất đến ẩm thực. #Quanghocduong #learnontiktok #hoccungtiktok #hocsinh',
    label: 'not_review',
    reason: 'TikTok video caption with hashtags — metadata, not personal review content',
  },
  {
    text: 'Bài viết này MATHX xin gửi tới phụ huynh và các em học sinh một số thông tin cũng như đôi nét giới thiệu về trường THCS THPT Chuyên Trần Đại Nghĩa.',
    label: 'not_review',
    reason: 'tutoring center promotional article — "xin gửi tới" third-party byline',
  },
  {
    text: 'Mình học ở đây được 2 năm rồi, thầy cô dạy rất nhiệt tình, bạn bè thân thiện. Cơ sở vật chất mới được nâng cấp nên khá ổn. Chỉ hơi xa nhà thôi.',
    label: 'review',
    reason: 'first-person ("mình"), specific duration, opinion on teachers/facilities',
  },
  {
    text: 'Con tôi đang học năm 2 ở đây. Nhìn chung môi trường học tốt, thầy cô có tâm. Tuy nhiên áp lực học khá lớn, phù hợp với các bạn có định hướng rõ ràng.',
    label: 'review',
    reason: 'parent perspective ("con tôi"), balanced opinion with pros and cons',
  },
]

// Hard-reject: any of these patterns instantly classifies as not_review
const HARD_REJECT_PATTERNS: RegExp[] = [
  // News source prefixes
  /^(tto|vtc|vnexpress|dantri|tuổi trẻ|thanh niên|zing|kenh14|24h)\s*[-–]/i,
  // Third-party promotional / tutoring site bylines
  /bài viết (này|sau) .{0,30} xin gửi/i,
  /xin gửi tới (phụ huynh|các em|bạn đọc)/i,
  /đôi nét giới thiệu/i,
  /một số thông tin .{0,20} giới thiệu/i,
  /(mathx|hocmai|moon\.vn|tuyensinh247|vietjack|toploigiai|loigiaihay|hoc247)/i,
  // Official announcement language
  /theo (thông báo|quyết định|công văn)/i,
  /nhà trường (thông báo|thông tin|kính mời)/i,
  // Event news ("vừa" = just happened)
  /vừa (trải nghiệm|ra mắt|khai mạc|tổ chức|diễn ra)/i,
  // Third-person journalism
  /một số (phụ huynh|học sinh|giáo viên) .{0,20} (bức xúc|phản ánh|lo lắng)/i,
  // Aggregator meta descriptions
  /nhận xét từ (sinh viên|học sinh|học giả)/i,
  // Social media captions with hashtags
  /#[a-zA-Zàáảãạăắặẳẵằâấậẩẫầèéẹẻẽêếệểễềìíịỉĩòóọỏõôốộổỗồơớợởỡờùúụủũưứựửữừỳýỵỷỹđ]+/i,
  // Video/content discovery titles
  /^khám phá (thông tin|những điều)/i,
  // Aggregator page titles
  /^review chi tiết về/i,
]

// Soft negative signals — each costs -3
const NEWS_SIGNALS = [
  'thông báo', 'kế hoạch', 'lịch thi', 'tuyển sinh năm',
  'chỉ tiêu', 'quyết định', 'ban giám hiệu', 'hội đồng', 'bộ giáo dục',
  'sở giáo dục', 'ubnd', 'phòng giáo dục', 'thông tin tuyển sinh',
  'thí sinh', 'nguyện vọng', 'đăng ký xét tuyển', 'hồ sơ đăng ký',
  'năm học 202', 'học kỳ', 'khai giảng', 'bế giảng', 'hội nghị',
  'báo cáo', 'tổng kết', 'khen thưởng', 'danh hiệu',
  'giới thiệu về trường', 'thông tin về trường', 'đôi nét về',
  'cái nhìn', 'định hướng tương lai', 'bố mẹ có thể',
  'chúng tôi xin', 'chúng tôi gửi', 'bài viết này',
  'từ đó có thể giúp', 'giúp bố mẹ', 'giúp phụ huynh',
]

// Soft positive signals — each adds +2
const REVIEW_SIGNALS = [
  'mình', 'tôi', 'con tôi', 'con em', 'con mình', 'bé nhà',
  'học ở đây', 'đang học', 'từng học', 'đã học ở', 'năm mình học',
  'hồi học', 'lúc học', 'khi học ở',
  'rất tốt', 'rất hay', 'rất thích', 'rất tệ', 'không tốt', 'không hay',
  'thầy cô dạy', 'giáo viên ở đây', 'cơ sở vật chất', 'căng tin',
  'nội quy trường', 'môi trường học', 'bạn bè ở đây',
  'đồng phục', 'học phí trường', 'câu lạc bộ',
  'ổn lắm', 'khá ổn', 'tốt lắm', 'chán lắm', 'rất vui',
  'nên học', 'không nên học', 'trải nghiệm của',
  'lựa chọn tốt', 'đều hơn', 'hơn hẳn',
  'áp lực học', 'chương trình học ở đây', 'thời khóa biểu',
]

export function scoreText(text: string): number {
  for (const pattern of HARD_REJECT_PATTERNS) {
    if (pattern.test(text)) return -999
  }
  const lower = text.toLowerCase()
  let score = 0
  for (const s of NEWS_SIGNALS) {
    if (lower.includes(s)) score -= 3
  }
  for (const s of REVIEW_SIGNALS) {
    if (lower.includes(s)) score += 2
  }
  if (text.length > 120) score += 1
  if (text.length > 200) score += 1
  if (text.length < 60) score -= 2
  return score
}

export function isReview(text: string): boolean {
  return scoreText(text) > 0
}
