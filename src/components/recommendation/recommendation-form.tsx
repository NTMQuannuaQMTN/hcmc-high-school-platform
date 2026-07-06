'use client'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Loader2, Calculator } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import type { StudentInput } from '@/types'


const GIFTED_SUBJECTS = [
  'Chuyên Anh',
  'Chuyên Địa',
  'Chuyên Hóa',
  'Chuyên Lý',
  'Chuyên Nhật',
  'Chuyên Pháp',
  'Chuyên Sinh',
  'Chuyên Sử',
  'Chuyên Tin',
  'Chuyên Toán',
  'Chuyên Trung',
  'Chuyên Văn',
]

const scoreField = z.string().min(1, 'Bắt buộc')
const optionalScore = z.string().optional()

const schema = z.object({
  score_math:       scoreField,
  score_literature: scoreField,
  score_english:    scoreField,
  gifted_subject:   z.string().optional(),
  gifted_score:     optionalScore,
  integrated_score: optionalScore,
  target_year:      z.number(),
  strategy:         z.enum(['all', 'safe', 'top']),
  generate_wishes:  z.boolean(),
})

type FormValues = z.infer<typeof schema>

function parseScore(s: string | undefined): number | undefined {
  if (!s || s.trim() === '') return undefined
  const n = parseFloat(s)
  return isNaN(n) ? undefined : n
}

function formatTotal(n: number | undefined): string {
  return n !== undefined ? n.toFixed(2) : '—'
}

interface Props {
  onSubmit: (input: StudentInput) => void
  isLoading: boolean
}

export function RecommendationForm({ onSubmit, isLoading }: Props) {
  const [locating, setLocating] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  
  const [address, setAddress] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ lat: number; lng: number; display_name: string }>>([])
  const [geocoding, setGeocoding] = useState(false)
  const [geocodedAddress, setGeocodedAddress] = useState<string | null>(null)
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      target_year: 2026,
      strategy: 'all',
      generate_wishes: true,
    }
  })

  const watched = useWatch({ control })
  const math   = parseScore(watched.score_math)
  const lit    = parseScore(watched.score_literature)
  const eng    = parseScore(watched.score_english)
  const gifted = parseScore(watched.gifted_score)
  const integ  = parseScore(watched.integrated_score)
  const hasGiftedSubject = !!watched.gifted_subject

  const baseTotal = (math !== undefined && lit !== undefined && eng !== undefined)
    ? math + lit + eng : undefined

  const specializedTotal = baseTotal !== undefined && hasGiftedSubject && gifted !== undefined
    ? baseTotal + 2 * gifted : undefined

  const integratedTotal = baseTotal !== undefined && integ !== undefined
    ? baseTotal + 2 * integ : undefined

  // Click away listener to close suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced geocoding search suggestion
  useEffect(() => {
    if (!address.trim() || address.length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    // Skip suggestion lookup if we just successfully selected this exact address
    if (geocodeStatus === 'success' && geocodedAddress === address) {
      return
    }

    const timer = setTimeout(async () => {
      setGeocoding(true)
      try {
        const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data)
          setShowDropdown(data.length > 0)
        }
      } catch (err) {
        setSuggestions([])
        setShowDropdown(false)
      } finally {
        setGeocoding(false)
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(timer)
  }, [address, geocodeStatus, geocodedAddress])

  async function resolveAddress(addr: string) {
    if (!addr.trim()) return null
    setGeocoding(true)
    setGeocodeStatus('loading')
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(addr)}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      if (data && data.length > 0) {
        const first = data[0]
        selectSuggestion(first)
        return first
      } else {
        throw new Error('Not found')
      }
    } catch (err) {
      setGeocodeStatus('error')
      setGeocodedAddress(null)
      setLocation(null)
      return null
    } finally {
      setGeocoding(false)
    }
  }

  function selectSuggestion(s: { lat: number; lng: number; display_name: string }) {
    setAddress(s.display_name)
    setLocation({ lat: s.lat, lng: s.lng })
    setGeocodedAddress(s.display_name)
    setGeocodeStatus('success')
    setSuggestions([])
    setShowDropdown(false)
  }

  function detectLocation() {
    setLocating(true)
    setAddress('')
    setGeocodedAddress(null)
    setGeocodeStatus('idle')
    setSuggestions([])
    setShowDropdown(false)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
        setGeocodeStatus('success')
        setGeocodedAddress('Vị trí chính xác từ thiết bị')
      },
      async () => {
        // Fallback to IP Geolocation if GPS fails
        try {
          const res = await fetch('/api/geocode?ip=true')
          if (res.ok) {
            const data = await res.json()
            if (data && data.length > 0) {
              const first = data[0]
              setLocation({ lat: first.lat, lng: first.lng })
              setGeocodeStatus('success')
              setGeocodedAddress(first.display_name)
              setAddress(first.display_name)
              setLocating(false)
              return
            }
          }
        } catch (err) {
          // Ignore and let it error
        }
        setLocating(false)
        setGeocodeStatus('error')
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  }

  async function submit(values: FormValues) {
    const m = parseScore(values.score_math)
    const l = parseScore(values.score_literature)
    const e = parseScore(values.score_english)
    if (m === undefined || l === undefined || e === undefined) return

    let currentLoc = location
    
    // Geocode address on the fly if user typed one but hasn't resolved it yet
    if (address.trim() && geocodeStatus !== 'success') {
      const loc = await resolveAddress(address)
      if (loc) {
        currentLoc = loc
      }
    }

    onSubmit({
      score_math: m,
      score_literature: l,
      score_english: e,
      gifted_subject: values.gifted_subject || undefined,
      gifted_score: parseScore(values.gifted_score),
      integrated_score: parseScore(values.integrated_score),
      lat: currentLoc?.lat,
      lng: currentLoc?.lng,
      target_year: values.target_year,
      strategy: values.strategy,
      generate_wishes: values.generate_wishes,
    })
  }

  return (
    <Card className="shadow-md border-border/80 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">Nhập điểm thi</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="space-y-5">

          {/* 3 mandatory subjects */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">3 môn bắt buộc</p>
            {([
              { field: 'score_math'       as const, label: 'Toán' },
              { field: 'score_literature' as const, label: 'Ngữ văn' },
              { field: 'score_english'    as const, label: 'Ngoại ngữ' },
            ] as const).map(({ field, label }) => (
              <div key={field} className="flex items-center gap-3">
                <Label className="w-20 shrink-0 text-sm font-medium">{label}</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="10"
                  placeholder="0 – 10"
                  className="h-9 bg-background"
                  {...register(field)}
                />
                {errors[field] && (
                  <span className="text-xs text-destructive whitespace-nowrap">
                    {errors[field]?.message}
                  </span>
                )}
              </div>
            ))}
          </div>

          <Separator className="bg-border/60" />

          {/* Môn chuyên */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Môn chuyên (×2) — tuỳ chọn</p>

            {/* Subject selector */}
            <div className="flex items-center gap-3">
              <Label className="w-20 shrink-0 text-sm font-medium">Môn chuyên</Label>
              <Select onValueChange={(v: string) => setValue('gifted_subject', v === '__none__' ? '' : v)}>
                <SelectTrigger className="h-9 flex-1 bg-background">
                  <SelectValue placeholder="Chọn môn…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Không thi chuyên —</SelectItem>
                  {GIFTED_SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Score — only shown when a subject is chosen */}
            {hasGiftedSubject && (
              <div className="flex items-center gap-3">
                <Label className="w-20 shrink-0 text-sm text-muted-foreground font-medium">Điểm</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="10"
                  placeholder="0 – 10"
                  className="h-9 flex-1 bg-background"
                  {...register('gifted_score')}
                />
              </div>
            )}
          </div>

          {/* Tích hợp */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tích hợp (×2) — tuỳ chọn</p>
            <div className="flex items-center gap-3">
              <Label className="w-20 shrink-0 text-sm font-medium">Tích hợp</Label>
              <Input
                type="number"
                step="0.25"
                min="0"
                max="10"
                placeholder="0 – 10"
                className="h-9 flex-1 bg-background"
                {...register('integrated_score')}
              />
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* Dự đoán & Tuyển sinh */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cấu hình bộ lọc & Dự đoán</p>
            
            {/* Năm tuyển sinh */}
            <div className="flex items-center gap-3">
              <Label className="w-20 shrink-0 text-sm font-medium">Năm chọn</Label>
              <Select defaultValue="2026" onValueChange={(v: string) => setValue('target_year', parseInt(v))}>
                <SelectTrigger className="h-9 flex-1 bg-background">
                  <SelectValue placeholder="Chọn năm…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">Năm 2026 (Thực tế)</SelectItem>
                  <SelectItem value="2027">Năm 2027 (Dự đoán)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chiến lược chọn trường */}
            <div className="flex items-center gap-3">
              <Label className="w-20 shrink-0 text-sm font-medium">Chiến lược</Label>
              <Select defaultValue="all" onValueChange={(v: any) => setValue('strategy', v)}>
                <SelectTrigger className="h-9 flex-1 bg-background">
                  <SelectValue placeholder="Tất cả trường…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả các trường</SelectItem>
                  <SelectItem value="safe">Điểm an toàn / Vừa tầm</SelectItem>
                  <SelectItem value="top">Trường Top / Thử thách</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gợi ý 3 nguyện vọng checkbox */}
            <div className="flex items-center gap-2.5 pt-1.5 px-0.5">
              <input
                type="checkbox"
                id="generate_wishes"
                className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary cursor-pointer accent-primary"
                {...register('generate_wishes')}
              />
              <Label htmlFor="generate_wishes" className="text-xs font-semibold text-muted-foreground cursor-pointer select-none leading-none">
                Gợi ý 3 nguyện vọng tối ưu (NV1, 2, 3)
              </Label>
            </div>
          </div>

          {/* Live total preview */}
          {baseTotal !== undefined && (
            <>
              <Separator className="bg-border/60" />
              <div className="rounded-xl bg-muted/50 border border-muted p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                  <Calculator className="h-3.5 w-3.5 text-primary" />
                  Tổng điểm dự kiến
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Thường (max 30)</span>
                  <span className="font-mono font-bold">{formatTotal(baseTotal)}</span>
                </div>
                {specializedTotal !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      Chuyên {watched.gifted_subject} (max 50)
                    </span>
                    <span className="font-mono font-bold text-primary">{formatTotal(specializedTotal)}</span>
                  </div>
                )}
                {integratedTotal !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Tích hợp (max 50)</span>
                    <span className="font-mono font-bold text-primary">{formatTotal(integratedTotal)}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator className="bg-border/60" />

          {/* Location / Address */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Địa chỉ nhà (để tính khoảng cách)</p>
            
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-2">
                <Input
                  placeholder="Gõ tắt, ví dụ: 123 nguyen trai q5..."
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value)
                    setGeocodeStatus('idle')
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowDropdown(true)
                    }
                  }}
                  className="h-9 flex-1 bg-background"
                />
                {geocodeStatus !== 'success' && address.trim() && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => resolveAddress(address)}
                    disabled={geocoding || !address.trim()}
                    className="h-9 text-xs"
                  >
                    {geocoding ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Tìm'}
                  </Button>
                )}
              </div>

              {/* Autocomplete Suggestions List */}
              {showDropdown && suggestions.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border bg-card text-card-foreground shadow-lg text-xs divide-y divide-border/60 focus:outline-none backdrop-blur-md">
                  {suggestions.map((s, index) => (
                    <li
                      key={index}
                      onClick={() => selectSuggestion(s)}
                      className="px-3 py-2.5 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all line-clamp-2 text-[11px] leading-normal font-medium"
                    >
                      📍 {s.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">Hoặc dùng định vị GPS:</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 hover:bg-muted font-semibold text-primary hover:text-primary/95"
                onClick={detectLocation}
                disabled={locating}
              >
                {locating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MapPin className="mr-1 h-3 w-3" />}
                Dùng GPS
              </Button>
            </div>

            {/* Address resolution status */}
            {geocodeStatus === 'loading' && (
              <p className="text-[11px] text-primary flex items-center gap-1 font-medium">
                <Loader2 className="h-3 w-3 animate-spin" /> Đang định vị địa chỉ...
              </p>
            )}
            {geocodeStatus === 'success' && geocodedAddress && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 space-y-0.5 shadow-sm">
                <p className="font-bold flex items-center gap-1">✓ Đã định vị thành công</p>
                <p className="line-clamp-2 opacity-90">{geocodedAddress}</p>
              </div>
            )}
            {geocodeStatus === 'error' && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                ❌ Không thể xác định địa điểm. Vui lòng nhập rõ ràng hơn.
              </p>
            )}
          </div>

          <Button type="submit" className="w-full font-bold shadow-md hover:opacity-95 bg-primary text-primary-foreground" disabled={isLoading || geocoding}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tìm trường phù hợp
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

