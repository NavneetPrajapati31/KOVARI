"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";

interface Target {
  id: string;
  name: string;
  imageUrl?: string;
}

interface TargetSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "user" | "group";
  onSelectTarget: (id: string, name: string) => void;
}

export function TargetSelectionDialog({
  open,
  onOpenChange,
  targetType,
  onSelectTarget
}: TargetSelectionDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Target[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError(null);
      return;
    }

    const fetchTargets = async (q: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/reports/targets?type=${targetType}&q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setResults(data.targets || []);
      } catch (err) {
        setError("Error loading " + (targetType === "user" ? "users" : "groups"));
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchTargets(query);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, open, targetType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-border/60 max-w-[min(480px,calc(100vw-2rem))] p-0 gap-0 overflow-hidden bg-background shadow-lg">
        <div className="px-6 py-5 border-b border-border/40 bg-card">
          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
              Report a {targetType === "user" ? "User" : "Group"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Search to find the profile you wish to report.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-4 border-b border-border/40 bg-card/40">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${targetType === "user" ? "users" : "groups"}...`}
              className="pl-10 h-10 bg-secondary/50 border-transparent rounded-xl focus-visible:ring-1 focus-visible:ring-primary/40 text-sm shadow-none"
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-[300px] sm:max-h-[380px] p-0 bg-card">
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/60" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-destructive">{error}</div>
          ) : results.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground/80 flex flex-col items-center">
              <Search className="w-8 h-8 mb-3 text-muted-foreground/30" />
              <p>No {targetType === "user" ? "users" : "groups"} found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {results.map((target) => (
                <button
                  key={target.id}
                  onClick={() => onSelectTarget(target.id, target.name)}
                  className="w-full flex items-center py-3.5 px-5 hover:bg-secondary/40 active:bg-secondary/60 transition-colors text-left"
                >
                  <Avatar className="w-10 h-10 mr-4 border border-border/50">
                    <AvatarImage src={target.imageUrl} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                      {target.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{target.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

