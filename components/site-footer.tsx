export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
        <p>&copy; {new Date().getFullYear()} Daily Routine</p>
        <p>
          Built by{" "}
          <a
            href="https://yashvirpal.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Yashvir Pal
          </a>
        </p>
      </div>
    </footer>
  );
}
