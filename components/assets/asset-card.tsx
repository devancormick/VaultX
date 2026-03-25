"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Link2, FileBox, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import type { Asset } from "@/lib/supabase/types";

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);

  async function handleCopyLink() {
    setCopying(true);
    try {
      const res = await fetch(`/api/assets/signed-url?asset=${encodeURIComponent(asset.storage_path)}`);
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        toast({ title: "Failed to copy link", description: data.error, variant: "error" });
        return;
      }
      const data = await res.json() as { signedUrl: string };
      await navigator.clipboard.writeText(data.signedUrl);
      toast({
        title: "Secure link copied",
        description: "This link expires in 5 minutes.",
        variant: "success",
      });
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-card overflow-hidden hover:border-border/80 hover:shadow-glow-sm transition-all duration-200">
      {/* Thumbnail */}
      <div className="aspect-[4/3] bg-surface flex items-center justify-center relative overflow-hidden">
        {asset.thumbnail_url ? (
          <Image
            src={asset.thumbnail_url}
            alt={asset.file_name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <FileBox className="w-10 h-10 text-muted/30" />
        )}
        {asset.file_type && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="uppercase text-xs font-mono">
              {asset.file_type}
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-text truncate" title={asset.file_name}>
            {asset.file_name}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted">
            {asset.file_size && <span>{formatBytes(asset.file_size)}</span>}
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(asset.created_at)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/viewer?asset=${encodeURIComponent(asset.storage_path)}`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full">
              <Eye className="w-3.5 h-3.5" /> View
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={handleCopyLink}
            loading={copying}
          >
            <Link2 className="w-3.5 h-3.5" /> Copy link
          </Button>
        </div>
      </div>
    </div>
  );
}
