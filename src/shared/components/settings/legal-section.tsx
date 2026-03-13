"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, Shield, BookOpen, Trash2 } from "lucide-react";
import {
  TERMS_VERSION,
  PRIVACY_VERSION,
  GUIDELINES_VERSION,
} from "@/lib/policy-versions";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Spinner } from "@heroui/react";

interface PolicyAcceptance {
  terms_accepted_at?: string | null;
  privacy_accepted_at?: string | null;
  guidelines_accepted_at?: string | null;
  terms_version?: string | null;
  privacy_version?: string | null;
  guidelines_version?: string | null;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "Not accepted";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const POLICY_LINKS = [
  {
    label: "Terms of Service",
    href: "/terms",
    icon: FileText,
  },
  {
    label: "Privacy Policy",
    href: "/privacy",
    icon: Shield,
  },
  {
    label: "Community Guidelines",
    href: "/community-guidelines",
    icon: BookOpen,
  },
  {
    label: "Data Deletion Policy",
    href: "/data-deletion",
    icon: Trash2,
  },
];

export function LegalSection() {
  const [acceptance, setAcceptance] = useState<PolicyAcceptance | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchAcceptance = async () => {
      try {
        const res = await fetch("/api/settings/accept-policies");
        if (res.ok) {
          const data = await res.json();
          setAcceptance(data);
        }
      } catch {
        // silently fail — read-only display
      } finally {
        setLoading(false);
      }
    };
    fetchAcceptance();
  }, []);

  return (
    <div className={`w-full mx-auto ${isMobile ? "p-0" : "p-4"} space-y-6`}>
      {/* Header */}
      <div className="md:space-y-2 space-y-1">
        <h1 className="md:text-lg text-sm font-semibold text-foreground">
          Legal &amp; Policies
        </h1>
        <p className="md:text-sm text-xs text-muted-foreground">
          Review Kovari&apos;s policies and your acceptance history.
        </p>
      </div>

      {/* Policy Documents */}
      <section className="rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Policy Documents
          </p>
        </div>
        <div className="bg-card divide-y divide-border">
          {POLICY_LINKS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 hover:bg-secondary transition-colors duration-150"
            >
              <span className="flex items-center gap-3 text-sm text-foreground">
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {label}
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* Acceptance Status */}
      <section className="rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Policy Acceptance Status
          </p>
        </div>
        <div className="bg-card divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Spinner variant="spinner" size="sm" classNames={{spinnerBars:"bg-muted-foreground"}} />
            </div>
          ) : (
            <>
              {[
                {
                  label: "Terms of Service",
                  date: acceptance?.terms_accepted_at,
                  version: acceptance?.terms_version,
                  current: TERMS_VERSION,
                },
                {
                  label: "Privacy Policy",
                  date: acceptance?.privacy_accepted_at,
                  version: acceptance?.privacy_version,
                  current: PRIVACY_VERSION,
                },
                {
                  label: "Community Guidelines",
                  date: acceptance?.guidelines_accepted_at,
                  version: acceptance?.guidelines_version,
                  current: GUIDELINES_VERSION,
                },
              ].map(({ label, date, version, current }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      Accepted: {formatDate(date)}
                    </span>
                    {version && (
                      <span className="text-xs text-muted-foreground">
                        Version: {version}
                        {version !== current && (
                          <span className="ml-1.5 text-amber-600 dark:text-amber-500 font-medium">
                            (update available: {current})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      date ? "bg-green-500" : "bg-muted-foreground/40"
                    }`}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
