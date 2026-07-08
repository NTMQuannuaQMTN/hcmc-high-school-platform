'use client'
import { AdminGuard } from '@/components/admin/admin-guard'
import { AddSchoolForm } from '@/components/admin/add-school-form'
import { AddProgramForm } from '@/components/admin/add-program-form'
import { AddCutoffForm } from '@/components/admin/add-cutoff-form'
import { CSVImport } from '@/components/admin/csv-import'
import { BulkSchoolImport } from '@/components/admin/bulk-school-import'
import { ScrapeReviewsTool } from '@/components/admin/scrape-reviews-tool'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { School, BookOpen, TrendingUp, Upload, Globe } from 'lucide-react'

export default function AdminPage() {
  return (
    <AdminGuard>
      {(secret) => (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bảng điều hành</h1>
            <p className="text-muted-foreground mt-1">Quản lý dữ liệu trường học và điểm chuẩn</p>
          </div>

          <Tabs defaultValue="schools">
            <TabsList className="grid w-full grid-cols-5 max-w-xl">
              <TabsTrigger value="schools" className="gap-1.5">
                <School className="h-4 w-4" />
                <span className="hidden sm:inline">Trường</span>
              </TabsTrigger>
              <TabsTrigger value="programs" className="gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Ban</span>
              </TabsTrigger>
              <TabsTrigger value="cutoffs" className="gap-1.5">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Điểm</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-1.5">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-1.5">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Đánh giá</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schools" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thêm trường mới</CardTitle>
                  <CardDescription>Nhập thủ công thông tin một trường THPT</CardDescription>
                </CardHeader>
                <CardContent>
                  <AddSchoolForm secret={secret} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Import trường từ CSV</CardTitle>
                  <CardDescription>Upload file CSV — hệ thống tự lấy tọa độ qua OpenStreetMap cho từng dòng</CardDescription>
                </CardHeader>
                <CardContent>
                  <BulkSchoolImport secret={secret} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="programs" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thêm ban học</CardTitle>
                  <CardDescription>Thêm ban/chương trình học cho một trường</CardDescription>
                </CardHeader>
                <CardContent>
                  <AddProgramForm secret={secret} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cutoffs" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nhập điểm chuẩn</CardTitle>
                  <CardDescription>Thêm điểm chuẩn tuyển sinh theo năm</CardDescription>
                </CardHeader>
                <CardContent>
                  <AddCutoffForm secret={secret} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="import" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Import CSV</CardTitle>
                  <CardDescription>Nhập hàng loạt điểm chuẩn hoặc đánh giá từ file CSV</CardDescription>
                </CardHeader>
                <CardContent>
                  <CSVImport secret={secret} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scrape đánh giá từ web</CardTitle>
                  <CardDescription>Tự động tìm kiếm đánh giá về trường trên DuckDuckGo và lưu vào DB</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrapeReviewsTool secret={secret} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AdminGuard>
  )
}
