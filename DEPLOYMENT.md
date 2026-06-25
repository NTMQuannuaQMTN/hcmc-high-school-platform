# HCMC High School Navigator — Deployment Guide

## Prerequisites

- Node.js 20+
- A Supabase project (free tier works)
- A Google Maps API key (Maps JavaScript API enabled)
- An OpenAI API key (for AI review summaries)

---

## 1. Supabase Setup

### Create a project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to Vietnam (e.g., Singapore)

### Run migrations

Option A — Supabase CLI (recommended):
```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

Option B — SQL Editor in Dashboard:
1. Open **Supabase Dashboard → SQL Editor**
2. Paste and run `supabase/migrations/001_initial_schema.sql`
3. Paste and run `supabase/migrations/002_recommendation_view.sql`

### Get API keys

From **Project Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key (keep secret!)

---

## 2. Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps JavaScript API** and **Places API**
3. Create an API key under **Credentials**
4. Restrict the key to your domain in production

---

## 3. Local Development

```bash
# Clone / enter the project
cd hcmc-high-school-platform

# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env.local
# Edit .env.local with your actual keys

# Seed the database with sample data
npm run seed

# Start development server
npm run dev
# → http://localhost:3000
```

---

## 4. Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JS API key |
| `OPENAI_API_KEY` | OpenAI API key for AI summaries |
| `ADMIN_SECRET` | Secret token to protect admin routes |

---

## 5. Deploy to Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Or via the Vercel Dashboard:

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add all environment variables in **Project Settings → Environment Variables**
4. Deploy

### Important Vercel settings

- Framework: Next.js (auto-detected)
- Node.js version: 20.x
- Build command: `npm run build` (default)
- Output directory: `.next` (default)

---

## 6. Seed Production Database

After deploying, seed real data:
```bash
# Uses .env.local credentials — point to your prod Supabase project
npm run seed
```

Or import data via the Admin Dashboard at `/admin` using CSV files.

---

## 7. Admin Dashboard

Navigate to `/admin` and enter your `ADMIN_SECRET` value.

Available actions:
- **Add School** — manually add a school
- **Add Program** — add a program/track to a school
- **Add Cutoff** — enter admission cutoff scores per year
- **CSV Import** — bulk import cutoffs or reviews

### CSV formats

**Cutoffs** (`template_cutoffs.csv`):
```
school_name,program_name,program_type,year,cutoff_score
THPT Lê Quý Đôn,Ban tự nhiên,NORMAL,2024,8.75
```

**Reviews** (`template_reviews.csv`):
```
school_name,source,content
THPT Lê Quý Đôn,Google Reviews,Trường tốt thầy cô nhiệt tình.
```

Download templates directly from the Import tab in the Admin Dashboard.

---

## 8. Project Structure

```
src/
├── app/
│   ├── page.tsx               # Home / landing page
│   ├── recommend/page.tsx     # Student recommendation page
│   ├── schools/
│   │   ├── page.tsx           # School list
│   │   └── [id]/page.tsx      # School detail
│   ├── admin/page.tsx         # Admin dashboard
│   └── api/
│       ├── schools/           # GET all schools, GET by ID
│       ├── programs/          # GET all programs
│       ├── recommend/         # POST recommendation engine
│       ├── ai/summary/        # GET AI review summary
│       └── admin/             # POST schools/programs/cutoffs, import
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── shared/                # Navbar, Providers, Badges, Map
│   ├── recommendation/        # Form + Results table
│   ├── school/                # CutoffChart, AISummaryCard
│   └── admin/                 # AdminGuard, Add* forms, CSVImport
├── hooks/                     # useSchools, useRecommendation
├── lib/
│   ├── supabase/              # Client + Server Supabase instances
│   ├── recommendation.ts      # Score diff + admission chance logic
│   ├── query-client.ts        # React Query setup
│   └── utils.ts               # cn(), label maps
├── types/index.ts             # All TypeScript interfaces
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    └── 002_recommendation_view.sql
scripts/
└── seed.ts                    # Database seeder
```

---

## 9. Recommendation Logic

Scores are matched based on program type:
- **NORMAL** programs → use `entrance_score`
- **SPECIALIZED** programs → use `specialized_score` (falls back to `entrance_score`)
- **INTEGRATED** programs → use `integrated_score` (falls back to `entrance_score`)

Admission chance:
| Score difference | Chance |
|---|---|
| `>= 1.5` | **Cao** (High) |
| `>= 0` | **Trung bình** (Medium) |
| `< 0` | **Thấp** (Low) |

Distance is calculated using the Haversine formula from the student's geolocation.
