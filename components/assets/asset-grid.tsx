"use client";

import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetCard } from "./asset-card";
import type { Asset } from "@/lib/supabase/types";

type SortKey = "date" | "size" | "name";
type FilterType = "all" | "glb" | "gltf" | "png" | "jpg" | "hdr";

interface AssetGridProps {
  assets: Asset[];
  canUpload: boolean;
}

export function AssetGrid({ assets, canUpload }: AssetGridProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortKey>("date");

  const filtered = assets
    .filter((a) => filter === "all" || a.file_type === filter)
    .filter((a) => a.file_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "size") return (b.file_size ?? 0) - (a.file_size ?? 0);
      if (sort === "name") return a.file_name.localeCompare(b.file_name);
      return 0;
    });

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-5">
          <FolderOpen className="w-7 h-7 text-muted" />
        </div>
        <h3 className="font-display font-extrabold text-lg text-text mb-2">No assets yet</h3>
        <p className="text-muted text-sm mb-6 max-w-xs">
          {canUpload
            ? "Upload your first GLB, GLTF, or image file to get started."
            : "Upgrade to Pro or Enterprise to upload assets."}
        </p>
        {!canUpload && (
          <a href="/onboarding">
            <Button size="sm">Upgrade plan</Button>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-9 px-3 rounded-lg bg-card border border-border text-text placeholder:text-muted text-sm focus:border-accent outline-none transition-all"
        />
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="h-9 px-2 rounded-lg bg-card border border-border text-text text-sm outline-none focus:border-accent"
          >
            <option value="all">All types</option>
            <option value="glb">GLB</option>
            <option value="gltf">GLTF</option>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="hdr">HDR</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 px-2 rounded-lg bg-card border border-border text-text text-sm outline-none focus:border-accent"
          >
            <option value="date">Newest</option>
            <option value="size">Largest</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm py-10 text-center">No assets match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}
