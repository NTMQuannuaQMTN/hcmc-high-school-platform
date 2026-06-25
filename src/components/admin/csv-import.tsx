'use client'
import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Upload, FileText, Loader2 } from 'lucide-react'

type ImportType = 'cutoffs' | 'reviews'

const TEMPLATES: Record<ImportType, { headers: string[]; example: string }> = {
  cutoffs: {
    headers: ['school_name', 'program_name', 'program_type', 'year', 'cutoff_score'],
    example: 'THPT Lê Quý Đôn,Ban Toán – Lý – Hóa,NORMAL,2024,8.75',
  },
  reviews: {
    headers: ['school_name', 'source', 'content'],
    example: 'THPT Lê Quý Đôn,Google Reviews,Trường tốt, thầy cô nhiệt tình.',
  },
}

export function CSVImport({ secret }: { secret: string }) {
  const [type, setType] = useState<ImportType>('cutoffs')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function downloadTemplate() {
    const t = TEMPLATES[type]
    const csv = [t.headers.join(','), t.example].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `template_${type}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setLoading(true)
        const res = await fetch('/api/admin/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
          body: JSON.stringify({ type, rows: results.data }),
        })
        setLoading(false)
        if (res.ok) {
          const data = await res.json()
          setResult(data)
          toast.success(`Đã import ${data.imported} dòng`)
        } else {
          toast.error('Import thất bại')
        }
        if (fileRef.current) fileRef.current.value = ''
      },
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <Label>Loại dữ liệu</Label>
          <Select value={type} onValueChange={(v) => setType(v as ImportType)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cutoffs">Điểm chuẩn</SelectItem>
              <SelectItem value="reviews">Đánh giá</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <FileText className="mr-2 h-4 w-4" />
          Tải template CSV
        </Button>
      </div>

      <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-3">
        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Chọn file CSV để import</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="hidden"
          id="csv-upload"
          disabled={loading}
        />
        <Button asChild variant="outline" size="sm" disabled={loading}>
          <label htmlFor="csv-upload" className="cursor-pointer">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Chọn file
          </label>
        </Button>
      </div>

      {loading && <Progress value={undefined} className="h-1" />}

      {result && (
        <Alert variant={result.errors.length > 0 ? 'destructive' : 'default'}>
          <AlertDescription>
            <p>Đã import: <strong>{result.imported}</strong> dòng</p>
            {result.errors.length > 0 && (
              <ul className="mt-2 text-xs space-y-1">
                {result.errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
                {result.errors.length > 5 && <li>…và {result.errors.length - 5} lỗi khác</li>}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg bg-muted p-4 text-xs space-y-1">
        <p className="font-medium">Định dạng CSV ({type}):</p>
        <p className="font-mono">{TEMPLATES[type].headers.join(', ')}</p>
        <p className="text-muted-foreground">VD: {TEMPLATES[type].example}</p>
      </div>
    </div>
  )
}
