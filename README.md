This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
## Email configuration for automatic sending

This app is already wired to send customer emails with Nodemailer. To enable it:

1. In your Gmail account, create an App Password.
2. Put the real Gmail address and app password in the environment variables in `.env.local` or in Vercel's project settings.
3. Set `APP_URL` to your production domain, e.g. `https://dawn-tattoo-ink.vercel.app`.
4. Use the same Gmail account in `SMTP_USER` and `EMAIL_FROM` unless you have a verified custom domain.

Example:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-16-character-app-password
EMAIL_FROM="Dawn Tattoo Ink <your-gmail-address@gmail.com>"
APP_URL=https://dawn-tattoo-ink.vercel.app
```

Add the same values in your Vercel project under Settings → Environment Variables so the live site can send booking reminders, payment confirmations, and admin replies automatically.

## Gallery uploads on Vercel

Gallery images and videos are uploaded directly to Supabase Storage, and their public URLs are saved in the `gallery_items` table. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the server-side `SUPABASE_SERVICE_ROLE_KEY` in Vercel. The admin upload API creates or configures a public `gallery-media` bucket on first use; set `SUPABASE_STORAGE_BUCKET` only if you want a different bucket name. The server-side service role key is required for bucket setup and database writes; never expose it as a `NEXT_PUBLIC_` variable.

The `gallery_items` table must exist in Supabase. Existing gallery entries stored only in the repository's local JSON file cannot be edited or deleted on Vercel; add them again through the admin dashboard so they are saved in the database.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
