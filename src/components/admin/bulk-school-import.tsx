'use client'
import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Loader2, Upload, FileText, Clock, ClipboardPaste } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CsvRow {
  name: string
  address: string
  district: string
  website?: string
  description?: string
}

type RowState = 'pending' | 'geocoding' | 'inserting' | 'done' | 'error'

interface RowStatus {
  name: string
  address: string
  state: RowState
  error?: string
}

const TEMPLATE_HEADERS = ['name', 'address', 'district', 'website', 'description']
const TEMPLATE_EXAMPLE = 'THPT Lê Quý Đôn,110 Đinh Tiên Hoàng,Quận Bình Thạnh,https://lqd.edu.vn,'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function RowIcon({ state }: { state: RowState }) {
  if (state === 'done') return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
  if (state === 'error') return <XCircle className="h-4 w-4 text-red-500 shrink-0" />
  if (state === 'pending') return <Clock className="h-4 w-4 text-muted-foreground/40 shrink-0" />
  return <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
}

function stateLabel(state: RowState) {
  if (state === 'geocoding') return 'Lấy tọa độ…'
  if (state === 'inserting') return 'Lưu vào DB…'
  return ''
}

const REQUIRED = ['name', 'address', 'district']

function parseCsvText(text: string): { data: CsvRow[]; error?: string } {
  const result = Papa.parse<CsvRow>(text.trim(), { header: true, skipEmptyLines: true })
  const fields = result.meta.fields ?? []
  const missingCols = REQUIRED.filter((f) => !fields.includes(f))
  if (missingCols.length > 0) {
    return { data: [], error: `Thiếu cột: ${missingCols.join(', ')}. Cần có: name, address, district` }
  }
  return { data: result.data }
}

export function BulkSchoolImport({ secret }: { secret: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef(false)
  const [rows, setRows] = useState<RowStatus[]>([])
  const [current, setCurrent] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [showPaste, setShowPaste] = useState(false)

  function downloadTemplate() {
    const csv = [TEMPLATE_HEADERS.join(','), TEMPLATE_EXAMPLE].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'template_schools.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (fileRef.current) fileRef.current.value = ''
        const fields = result.meta.fields ?? []
        const missingCols = REQUIRED.filter((f) => !fields.includes(f))
        if (missingCols.length > 0) {
          toast.error(
            `File không đúng định dạng — thiếu cột: ${missingCols.join(', ')}.\nNếu dùng Numbers hoặc Excel, hãy xuất dưới dạng CSV trước.`,
          )
          return
        }
        startImport(result.data)
      },
    })
  }

  function handlePasteSubmit() {
    if (!pasteText.trim()) { toast.error('Chưa nhập nội dung'); return }
    const { data, error } = parseCsvText(pasteText)
    if (error) { toast.error(error); return }
    setPasteText('')
    setShowPaste(false)
    startImport(data)
  }

  async function startImport(data: CsvRow[]) {
    if (!data.length) { toast.error('Không có dòng nào'); return }
    const missing = data.filter((r) => !r.name || !r.address || !r.district)
    if (missing.length) {
      toast.error(`${missing.length} dòng thiếu name / address / district`)
      return
    }

    abortRef.current = false
    setDone(false)
    setCurrent(0)
    setRunning(true)
    setRows(data.map((r) => ({ name: r.name, address: r.address, state: 'pending' })))

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < data.length; i++) {
      if (abortRef.current) break
      const row = data[i]

      // --- geocode ---
      setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, state: 'geocoding' } : r))
      setCurrent(i)

      let lat: number | null = null
      let lng: number | null = null

      const geoParams = new URLSearchParams({ address: row.address })
      if (row.district) geoParams.set('district', row.district)
      const geoRes = await fetch(`/api/admin/geocode?${geoParams}`, {
        headers: { 'x-admin-secret': secret },
      })

      if (geoRes.ok) {
        const geo = await geoRes.json() as { lat: number; lng: number }
        lat = geo.lat; lng = geo.lng
      }
      // geocode failure → insert with NULL coordinates, don't skip

      // --- insert ---
      setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, state: 'inserting' } : r))

      const insertRes = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          name: row.name,
          address: row.address,
          district: row.district,
          website: row.website || null,
          description: row.description || null,
          type: 'PUBLIC',
          latitude: lat,
          longitude: lng,
        }),
      })

      if (insertRes.ok) {
        setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, state: 'done' } : r))
        successCount++
      } else {
        const e = await insertRes.json() as { error?: string }
        setRows((prev) => prev.map((r, idx) =>
          idx === i ? { ...r, state: 'error', error: `DB: ${e.error ?? 'thất bại'}` } : r
        ))
        errorCount++
      }

      // respect Nominatim 1 req/sec
      if (i < data.length - 1) await sleep(1100)
    }

    setRunning(false)
    setDone(true)
    setCurrent(data.length)
    if (successCount > 0) toast.success(`Đã thêm ${successCount} trường`)
    if (errorCount > 0) toast.error(`${errorCount} dòng thất bại`)
  }

  function cancel() {
    abortRef.current = true
  }

  function reset() {
    setRows([])
    setCurrent(0)
    setDone(false)
    setRunning(false)
    setShowPaste(false)
    setPasteText('')
  }

  const total = rows.length
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  const successCount = rows.filter((r) => r.state === 'done').length
  const errorCount = rows.filter((r) => r.state === 'error').length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={downloadTemplate} disabled={running}>
          <FileText className="mr-2 h-4 w-4" />
          Tải template CSV
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="hidden"
          id="bulk-school-upload"
          disabled={running}
        />
        {!running && (
          <>
            <Button asChild variant="outline" size="sm">
              <label htmlFor="bulk-school-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Chọn file CSV
              </label>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPaste((v) => !v)}
            >
              <ClipboardPaste className="mr-2 h-4 w-4" />
              Dán nội dung CSV
            </Button>
          </>
        )}
        {running && (
          <Button variant="destructive" size="sm" onClick={cancel}>
            Hủy
          </Button>
        )}
        {done && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Làm lại
          </Button>
        )}
      </div>

      {showPaste && !running && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Dán nội dung CSV vào đây (bao gồm dòng tiêu đề: <span className="font-mono">name,address,district,...</span>)
          </p>
          <Textarea
            rows={8}
            placeholder={`name,address,district,website,description\n${TEMPLATE_EXAMPLE}`}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePasteSubmit} disabled={!pasteText.trim()}>
              Bắt đầu import
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowPaste(false); setPasteText('') }}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {total > 0 && (
        <>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{running ? `Đang xử lý ${current + 1} / ${total}…` : done ? `Hoàn tất ${total} dòng` : ''}</span>
              <span className="tabular-nums">{successCount} ✓  {errorCount} ✗</span>
            </div>
            <Progress value={done ? 100 : pct} className="h-2" />
          </div>

          <div className="rounded-lg border divide-y max-h-72 overflow-y-auto text-sm">
            {rows.map((r, i) => (
              <div key={i} className={cn(
                'flex items-start gap-3 px-3 py-2',
                r.state === 'error' && 'bg-red-50',
                r.state === 'done' && 'bg-green-50/40',
              )}>
                <RowIcon state={r.state} />
                <div className="min-w-0 flex-1">
                  <span className="font-medium truncate block">{r.name}</span>
                  <span className="text-xs text-muted-foreground truncate block">{r.address}</span>
                  {r.error && <span className="text-xs text-red-600">{r.error}</span>}
                </div>
                {(r.state === 'geocoding' || r.state === 'inserting') && (
                  <span className="text-xs text-muted-foreground shrink-0 self-center">{stateLabel(r.state)}</span>
                )}
              </div>
            ))}
          </div>

          {done && errorCount > 0 && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs space-y-0.5">
                {rows.filter((r) => r.state === 'error').map((r, i) => (
                  <p key={i}><strong>{r.name}</strong>: {r.error}</p>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {!total && !showPaste && (
        <div className="rounded-lg bg-muted p-4 text-xs space-y-1">
          <p className="font-medium">Định dạng CSV:</p>
          <p className="font-mono">{TEMPLATE_HEADERS.join(', ')}</p>
          <p className="text-muted-foreground">Tọa độ sẽ được tra tự động qua OpenStreetMap (1 dòng/giây).</p>
          <p className="text-muted-foreground">Chỉ <strong>name, address, district</strong> là bắt buộc.</p>
        </div>
      )}
    </div>
  )
}
