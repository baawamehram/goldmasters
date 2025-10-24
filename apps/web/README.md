# Wishmasters Spot-the-Ball - Frontend

Next.js frontend application for the Wishmasters Spot-the-Ball competition platform.

## 🚀 Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Reusable component library
- **Framer Motion** - Animations
- **Konva.js** - Canvas for marker placement

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page (/)
│   ├── competitions/      # Competition listing
│   ├── competition/[id]/  # Competition details & entry
│   └── admin/             # Admin login
├── components/
│   └── ui/                # Reusable UI components (shadcn)
└── lib/
    └── utils.ts           # Utility functions
```

## 🎨 Design System

All components follow Figma design tokens defined in:
- `tailwind.config.ts` - Theme configuration
- `src/app/globals.css` - CSS variables and utilities

### Responsive Breakpoints
- `sm`: 640px (Mobile landscape, small tablets)
- `md`: 768px (Tablets)
- `lg`: 1024px (Laptops, small desktops)
- `xl`: 1280px (Desktops)
- `2xl`: 1536px (Large desktops)

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
