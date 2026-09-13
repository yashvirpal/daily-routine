"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Debounced search box — pushes `?q=` on `basePath` (dropping any page
 * param, so a new search always lands back on page 1). */
export function TableSearch({
  basePath,
  initialQuery,
  placeholder,
}: {
  basePath: string;
  initialQuery: string;
  placeholder: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    const handle = setTimeout(() => {
      router.push(value ? `${basePath}?q=${encodeURIComponent(value)}` : basePath);
    }, 300);
    return () => clearTimeout(handle);
  }, [value, router, basePath]);

  return (
    <div className="relative max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}
