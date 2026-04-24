import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import appCss from "../styles.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-sanskrit text-5xl text-saffron">ॐ</p>
        <h1 className="mt-4 text-7xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">
          This path is not in the scriptures.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-gradient-saffron px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bhagavad Gita — Verses, Chapters & Translations" },
      {
        name: "description",
        content:
          "Read the Bhagavad Gita with Sanskrit verses, transliteration, and translations from Swami Sivananda, Tejomayananda, Chinmayananda, Shri Purohit and more.",
      },
      {
        property: "og:title",
        content: "Bhagavad Gita — Verses, Chapters & Translations",
      },
      {
        property: "og:description",
        content:
          "Sanskrit verses with multilingual translations and commentaries from renowned scholars.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </QueryClientProvider>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <span className="font-sanskrit text-3xl text-saffron transition-transform group-hover:scale-110">
            ॐ
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold tracking-tight">
              Bhagavad Gītā
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Song of the Lord
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-saffron" }}
            className="px-3 py-1.5 rounded-md hover:text-saffron transition-colors font-medium"
          >
            Chapters
          </Link>
          <a
            href="https://github.com/LordsOwnAcc/Gita_Api"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-md hover:text-saffron transition-colors font-medium text-muted-foreground"
          >
            API
          </a>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center">
        <p className="font-sanskrit text-2xl text-saffron mb-2">
          ॥ श्रीकृष्णार्पणमस्तु ॥
        </p>
        <p className="text-xs text-muted-foreground">
          Verses sourced from the Gita API. Built with reverence.
        </p>
      </div>
    </footer>
  );
}
