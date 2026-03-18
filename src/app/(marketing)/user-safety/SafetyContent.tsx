"use client";

import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  PhoneCall,
  CheckCircle2,
  Search,
  Shield,
  Eye,
  Lock,
  ChevronRight,
  ArrowRight,
  Info,
  ExternalLink
} from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-background pb-10 font-sans">
      <div className="max-w-6xl mx-auto px-5 sm:px-5 relative z-20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="space-y-10"
        >
          {/* 1. HEADER (Styled like reference) */}
          <section className="px-4 pt-16 pb-2 flex flex-col items-center text-center">
            <ShieldCheck className="w-10 h-10 text-primary mb-3" strokeWidth={1.5} />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
              Safety & Trust
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs md:max-w-md mx-auto leading-relaxed">
              Travel is better when you feel safe about the people you're with. Kovari helps you connect intentionally before your trip — with safety, clarity, and control built into the experience.
            </p>
          </section>

          {/* 2. ACTIONS / MODERATION (iOS Grouped List style) */}
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100 ease-out fill-mode-both">
            <SectionTitle title="Safety & Moderation" />
            <div className="bg-card rounded-xl overflow-hidden border border-border/40">
              <div className="divide-y divide-border/40">
                <ListRow 
                  icon={AlertTriangle} 
                  iconBg="text-foreground"
                  label="Report unsafe behavior"
                  description="Easily flag users or content that violates our community standards."
                />
                <ListRow 
                  icon={Search} 
                  iconBg="text-foreground"
                  label="Group safety monitoring"
                  description="We review reported activity and take action when necessary to keep the community respectful and safe."
                />
                <ListRow 
                  icon={Shield} 
                  iconBg="text-foreground"
                  label="Manual moderation review"
                  description="Every report is reviewed by a human moderator to ensure fair action."
                />
              </div>
            </div>
          </section>

          {/* 3. TRANSPARENCY & RESPONSIBILITY (Subtle Card) */}
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200 ease-out fill-mode-both">
            <SectionTitle title="Transparency & Responsibility" />
            <div className="bg-card rounded-xl p-4 border border-border/40 flex gap-4 items-start">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Info className="w-4 h-4 text-primary" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base text-foreground font-medium">Identity Verification</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  KOVARI does not currently verify user identities. Users are encouraged to make independent decisions and take personal precautions when interacting with others.
                </p>
              </div>
            </div>
          </section>

          {/* 4. GUIDELINES SECTIONS (Notes style) */}
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 ease-out fill-mode-both">
            <div>
              <SectionTitle title="Solo Travel Guidelines" />
              <div className="bg-card rounded-xl p-4 border border-border/40">
                <ul className="space-y-4">
                  <TipRow text="Share full itinerary with a trusted friend" />
                  <TipRow text="Research local emergency numbers" />
                  <TipRow text="Leave quietly if you feel uncomfortable" />
                </ul>
              </div>
            </div>

            <div>
              <SectionTitle title="Group Travel Guidelines" />
              <div className="bg-card rounded-xl p-4 border border-border/40">
                <ul className="space-y-4">
                  <TipRow text="Meet in a public space before departing" />
                  <TipRow text="Discuss budgets and styles clearly upfront" />
                  <TipRow text="Avoid sharing sensitive financial info" />
                </ul>
              </div>
            </div>

            <div>
              <SectionTitle title="Real-Life Meetings" />
              <div className="bg-card rounded-xl p-4 border border-border/40">
                <ul className="space-y-4">
                  <TipRow text="First meeting must be in a well-lit cafe" />
                  <TipRow text="Arrange your own independent transport" />
                  <TipRow text="Text a friend when arriving and leaving" />
                </ul>
              </div>
            </div>
          </section>

          {/* 5. HOW REPORTING WORKS (Stepped list) */}
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-400 ease-out fill-mode-both">
             <SectionTitle title="How Reporting Works" />
             <div className="bg-card rounded-xl overflow-hidden border border-border/40">
               <div className="divide-y divide-border/40">
                {[
                  { icon: AlertTriangle, title: "1. Submission", desc: "Flag unsafe behavior securely." },
                  { icon: Search, title: "2. Investigation", desc: "Moderators review evidence manually." },
                  { icon: Shield, title: "3. Action Taken", desc: "Violators face warnings or bans." },
                  { icon: CheckCircle2, title: "4. Resolution", desc: "You are notified of the outcome." },
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-center p-4 px-6 bg-card">
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-base text-foreground font-medium">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
               </div>
               <div className="px-6 py-3 border-t border-border/40 bg-card">
                 <p className="text-sm text-muted-foreground leading-relaxed">
                   Reporting and enforcement are governed by our{" "}
                   <Link href="/terms" className="text-primary underline underline-offset-2">Terms of Service</Link>
                   {" "}and{" "}
                   <Link href="/community-guidelines" className="text-primary underline underline-offset-2">Community Guidelines</Link>.
                 </p>
               </div>
             </div>
          </section>

          {/* 6. EMERGENCY CONTACT (iOS Contact style) */}
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500 ease-out fill-mode-both">
            <SectionTitle title="Emergency Contact" />
            <div className="bg-card rounded-xl overflow-hidden border border-border/40">
              <div className="p-4 px-6 border-b border-border/40">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If in immediate danger, contact local authorities immediately.
                </p>
              </div>
              
              <div className="divide-y divide-border/40">
                <a href="tel:112" className="flex items-center justify-between p-4 px-6 hover:bg-secondary transition-colors duration-150">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-base text-foreground">National Emergency</h4>
                    <p className="text-base text-destructive">112</p>
                  </div>
                  <PhoneCall className="w-4 h-4 text-destructive" strokeWidth={1.5} />
                </a>

                <a href="tel:1091" className="flex items-center justify-between p-4 px-6 hover:bg-secondary transition-colors duration-150">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-base text-foreground">Women Helpline</h4>
                    <p className="text-base text-destructive">1091</p>
                  </div>
                  <PhoneCall className="w-4 h-4 text-destructive" strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </section>

          {/* 8. Trust Footer */}
          <section className="pt-8 pb-4 flex items-center justify-center animate-in fade-in duration-1000 delay-500">
                   <div className="flex items-center gap-x-3 text-xs text-muted-foreground uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 opacity-60" strokeWidth={1.5} /> Reviewed
                      </div>
                      <div className="w-1 h-1 rounded-full bg-border/60" />
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 opacity-60" strokeWidth={1.5} /> Encrypted
                      </div>
                   </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}

// ----------------------------------------
// Local Reusable Components (Matched to reference)
// ----------------------------------------

function SectionTitle({ title, rightLabel }: { title: string, rightLabel?: string }) {
  return (
    <div className="flex items-center justify-between px-4 pb-2">
      <h2 className="text-sm text-muted-foreground uppercase tracking-wider">{title}</h2>
      {rightLabel && (
        <span className="text-sm text-muted-foreground">{rightLabel}</span>
      )}
    </div>
  );
}

function ListRow({ icon: Icon, iconBg, label, description }: { icon: any, iconBg?: string, label: string, description: string }) {
  return (
    <div className="w-full flex items-start gap-4 p-4 bg-card">
      <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", iconBg || "text-foreground")}>
        <Icon className="w-4 h-4" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-base text-foreground font-medium">{label}</span>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function TipRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-5">
      <div className="mt-2 ml-2 w-1.5 h-1.5 bg-muted rounded-full flex-shrink-0" />
      <span className="text-base text-foreground leading-snug">{text}</span>
    </li>
  );
}
