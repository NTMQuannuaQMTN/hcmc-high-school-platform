import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AdmissionChance, ProgramType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CHANCE_LABELS: Record<AdmissionChance, string> = {
  HIGH: 'Cao',
  MEDIUM: 'Trung bình',
  LOW: 'Thấp',
}

export const CHANCE_COLORS: Record<AdmissionChance, string> = {
  HIGH: 'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-red-100 text-red-800 border-red-200',
}

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  SPECIALIZED: 'Chuyên',
  INTEGRATED: 'Tích hợp',
  NORMAL: 'Thường',
}


export const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export const DISTRICT_MAP: Record<string, string> = {
  'An Hội Đông': 'Quận 12',
  'An Khánh': 'Thành phố Thủ Đức',
  'An Lạc': 'Quận Bình Tân',
  'An Nhơn': 'Quận Gò Vấp',
  'An Nhơn Tây': 'Huyện Củ Chi',
  'An Phú Đông': 'Quận 12',
  'An Đông': 'Quận 5',
  'Bà Điểm': 'Huyện Hóc Môn',
  'Bình Chánh': 'Huyện Bình Chánh',
  'Bình Hưng': 'Huyện Bình Chánh',
  'Bình Hưng Hòa': 'Quận Bình Tân',
  'Bình Khánh': 'Huyện Cần Giờ',
  'Bình Lợi': 'Quận Bình Thạnh',
  'Bình Lợi Trung': 'Quận Bình Thạnh',
  'Bình Phú': 'Quận 6',
  'Bình Thới': 'Quận 11',
  'Bình Tiên': 'Quận 6',
  'Bình Trưng': 'Thành phố Thủ Đức',
  'Bình Trị Đông': 'Quận Bình Tân',
  'Bình Tân': 'Quận Bình Tân',
  'Bình Đông': 'Quận 8',
  'Bến Thành': 'Quận 1',
  'Chánh Hưng': 'Quận 8',
  'Chợ Lớn': 'Quận 5',
  'Chợ Quán': 'Quận 5',
  'Cần Giờ': 'Huyện Cần Giờ',
  'Cầu Ông Lãnh': 'Quận 1',
  'Diên Hồng': 'Quận 10',
  'Gia Định': 'Quận Bình Thạnh',
  'Hiệp Bình': 'Thành phố Thủ Đức',
  'Hiệp Phước': 'Huyện Nhà Bè',
  'Hòa Bình': 'Quận 11',
  'Hòa Hưng': 'Quận 10',
  'Hóc Môn': 'Huyện Hóc Môn',
  'Hưng Long': 'Huyện Bình Chánh',
  'Hạnh Thông': 'Quận Gò Vấp',
  'Linh Xuân': 'Thành phố Thủ Đức',
  'Long Bình': 'Thành phố Thủ Đức',
  'Long Trường': 'Thành phố Thủ Đức',
  'Minh Phụng': 'Quận 6',
  'Nhà Bè': 'Huyện Nhà Bè',
  'Phú Hòa Đông': 'Huyện Củ Chi',
  'Phú Lâm': 'Quận 6',
  'Phú Nhuận': 'Quận Phú Nhuận',
  'Phú Thọ Hòa': 'Quận Tân Phú',
  'Phú Định': 'Quận 8',
  'Phước Long': 'Thành phố Thủ Đức',
  'Phước Thắng': 'Thành phố Vũng Tàu',
  'Sài Gòn': 'Quận 1',
  'Tam Bình': 'Thành phố Thủ Đức',
  'Tam Thôn Hiệp': 'Huyện Cần Giờ',
  'Thanh Đa': 'Quận Bình Thạnh',
  'Thái Mỹ': 'Huyện Củ Chi',
  'Thông Tây Hội': 'Quận Gò Vấp',
  'Thạnh An': 'Huyện Cần Giờ',
  'Thạnh Mỹ Tây': 'Quận Bình Thạnh',
  'Thủ Dầu Một': 'Tỉnh Bình Dương',
  'Thủ Đức': 'Thành phố Thủ Đức',
  'Trung Lập': 'Huyện Củ Chi',
  'Tân An Hội': 'Huyện Củ Chi',
  'Tân Bình': 'Quận Tân Bình',
  'Tân Hòa': 'Quận Tân Phú',
  'Tân Hưng': 'Quận 7',
  'Tân Mỹ': 'Quận 7',
  'Tân Nhựt': 'Huyện Bình Chánh',
  'Tân Sơn Nhì': 'Quận Tân Phú',
  'Tân Sơn Nhất': 'Quận Tân Bình',
  'Tân Thông Hội': 'Huyện Củ Chi',
  'Tân Thới Hiệp': 'Quận 12',
  'Tân Vĩnh Lộc': 'Huyện Bình Chánh',
  'Tân Định': 'Quận 1',
  'Tây Thạnh': 'Quận Tân Phú',
  'Tăng Nhơn Phú': 'Thành phố Thủ Đức',
  'Vườn Lài': 'Quận 10',
  'Xuân Hòa': 'Quận 10',
  'Xuân Thới Sơn': 'Huyện Hóc Môn',
  'Xóm Chiếu': 'Quận 4',
  'Đông Hưng Thuận': 'Quận 12',
  'Đông Thạnh': 'Huyện Hóc Môn',
  'Đức Nhuận': 'Quận 5'
}

export function getActualDistrict(dbDistrict: string): string {
  return DISTRICT_MAP[dbDistrict] || dbDistrict || 'Khác'
}

