'use client'
import { useSchool } from '@/hooks/use-schools'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { MapPin, Globe, Building2, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CutoffChart } from '@/components/school/cutoff-chart'
import { AISummaryCard } from '@/components/school/ai-summary'
import { ProgramBadge } from '@/components/shared/program-badge'
import { SchoolDetailMap } from '@/components/school/school-detail-map'
import { Skeleton } from '@/components/ui/skeleton'

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: school, isLoading, isError } = useSchool(id)

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-96" />
      <Skeleton className="h-72 w-full" />
    </div>
  )

  if (isError || !school) return (
    <div className="text-center py-20 text-muted-foreground">
      Không tìm thấy trường.{' '}
      <Link href="/schools" className="text-primary underline">Quay lại danh sách</Link>
    </div>
  )

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/schools"><ArrowLeft className="mr-1 h-4 w-4" />Danh sách trường</Link>
      </Button>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{school.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" />{school.address}
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4 shrink-0" />{school.district}
          </span>
          {school.website && (
            <a href={school.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline">
              <Globe className="h-4 w-4" />
              {school.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
        {school.description && (
          <p className="text-muted-foreground max-w-3xl pt-1">{school.description}</p>
        )}
      </div>

      <Tabs defaultValue="programs">
        <TabsList>
          <TabsTrigger value="programs">Chương trình & Điểm chuẩn</TabsTrigger>
          <TabsTrigger value="map">Bản đồ</TabsTrigger>
          <TabsTrigger value="reviews">Đánh giá ({school.reviews.length})</TabsTrigger>
        </TabsList>

        {/* Programs & Cutoffs */}
        <TabsContent value="programs" className="space-y-5 mt-4">
          {school.programs.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Xu hướng điểm chuẩn theo năm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CutoffChart programs={school.programs} />
              </CardContent>
            </Card>
          )}

          {school.programs.map((program) => (
            <Card key={program.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{program.name}</CardTitle>
                  <ProgramBadge type={program.type} />
                </div>
              </CardHeader>
              <CardContent>
                {program.cutoffs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có dữ liệu điểm chuẩn.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {program.cutoffs
                      .sort((a, b) => b.year - a.year)
                      .map((c) => (
                        <div key={c.id} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{c.year}</span>
                          <Separator orientation="vertical" className="h-4" />
                          <span className="font-mono font-semibold text-sm">
                            {Number(c.cutoff_score).toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {school.programs.length === 0 && (
            <div className="border rounded-xl p-12 text-center text-muted-foreground">
              Chưa có chương trình học nào.
            </div>
          )}
        </TabsContent>

        {/* Map */}
        <TabsContent value="map" className="mt-4">
          {school.latitude && school.longitude ? (
            <div className="w-full h-[450px] rounded-xl overflow-hidden shadow-sm">
              <SchoolDetailMap
                name={school.name}
                address={school.address}
                district={school.district}
                latitude={school.latitude}
                longitude={school.longitude}
              />
            </div>
          ) : (
            <div className="border rounded-xl p-12 text-center text-muted-foreground">
              Chưa có dữ liệu toạ độ cho trường này.
            </div>
          )}
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews" className="space-y-4 mt-4">
          <AISummaryCard schoolId={school.id} reviewCount={school.reviews.length} />

          {school.reviews.length === 0 ? (
            <div className="border rounded-xl p-12 text-center text-muted-foreground">
              Chưa có đánh giá nào.
            </div>
          ) : (
            school.reviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-4">
                  <p className="text-sm leading-relaxed">{r.content}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{r.source ?? 'Ẩn danh'}</span>
                    <span>·</span>
                    <span>{new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
