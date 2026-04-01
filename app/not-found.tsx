import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen noise-bg flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-display font-extrabold text-8xl text-accent mb-4">404</h1>
        <h2 className="font-display font-extrabold text-2xl text-text mb-2">Page not found</h2>
        <p className="text-muted text-sm mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/">
          <Button>Go home</Button>
        </Link>
      </div>
    </div>
  );
}
