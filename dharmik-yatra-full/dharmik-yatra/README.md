# Dharmik Yatra — production starter

Next.js + Supabase + WhatsApp booking website for fixed-date religious group yatras.

## 1. Local setup

1. Install Node.js 20+.
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill the values.
4. `npm run dev`
5. Open http://localhost:3000

## 2. Supabase

Create a Supabase project. In SQL Editor run `supabase/schema.sql`.

Create an Auth user for the operator in Authentication → Users. Then give that user the admin app_metadata role using the Supabase SQL editor/API workflow supported by your project. The policy expects:

`app_metadata.role = admin`

Do NOT put a service-role key in this Next.js client application.

## 3. Vercel

Import the GitHub repository into Vercel. Add all `NEXT_PUBLIC_*` variables under Project Settings → Environment Variables for Production/Preview as needed, then redeploy.

## 4. Before launch

- Replace demo phone/WhatsApp number.
- Replace demo prices and dates.
- Confirm every inclusion/exclusion with the operator.
- Add real pickup points.
- Add real photos with permission.
- Add real business name/address/legal details.
- Test booking on mobile.
- Test the admin login.
- Configure domain and analytics.
- Do not publish fake reviews or unverified claims.

## 5. WhatsApp

The current booking flow opens WhatsApp with a structured booking message. For true automated reminders/templates, connect the business to WhatsApp Business Platform after the core booking flow is proven.
