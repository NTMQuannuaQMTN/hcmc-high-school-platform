import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GraduationCap, MapPin, BarChart2, BookOpen, Sparkles, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="text-center space-y-7 pt-12 pb-4">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          <GraduationCap className="h-4 w-4" />
          Tuyển sinh THPT công lập TP.HCM 2025
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
          Biết điểm —<br />
          <span className="text-primary">chọn đúng trường</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Nhập điểm thi lớp 9, xem ngay danh sách trường công lập phù hợp, xác suất đậu và khoảng cách từ nhà bạn.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button asChild size="lg" className="rounded-full px-7">
            <Link href="/recommend">
              Tư vấn ngay <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-7">
            <Link href="/schools">Xem danh sách trường</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Tất cả trong một trang</h2>
          <p className="text-muted-foreground mt-1">Công cụ đầy đủ để chọn trường thông minh</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: BookOpen,
              title: 'Lịch sử điểm chuẩn',
              desc: 'Xem điểm chuẩn từng năm của tất cả trường và ban học để nắm xu hướng.',
            },
            {
              icon: BarChart2,
              title: 'Xác suất đậu',
              desc: 'So sánh điểm của bạn với điểm chuẩn — Cao, Trung bình, hay Thấp.',
            },
            {
              icon: MapPin,
              title: 'Khoảng cách từ nhà',
              desc: 'Bật định vị để sắp xếp trường theo khoảng cách, tiết kiệm thời gian đi lại.',
            },
            {
              icon: Sparkles,
              title: 'AI tóm tắt đánh giá',
              desc: 'GPT phân tích hàng chục đánh giá thực tế thành ưu điểm và nhược điểm ngắn gọn.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-0 shadow-sm bg-muted/40">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-primary text-primary-foreground p-10 text-center space-y-4">
        <h2 className="text-2xl font-bold">Sẵn sàng chưa?</h2>
        <p className="opacity-80">Chỉ mất 30 giây. Nhập điểm, nhận ngay kết quả.</p>
        <Button asChild size="lg" variant="secondary" className="rounded-full px-8">
          <Link href="/recommend">
            Bắt đầu ngay <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  )
}
