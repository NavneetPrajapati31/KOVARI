import Footer from "@/shared/components/landing/Footer";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Policy",
  description: "Learn how to securely delete your account and personal data from KOVARI, in strict compliance with GDPR and global privacy standards.",
};

export default function DataDeletionPage() {
  const lastUpdated = "February 27, 2026";

  return (
    <>
      <div className="min-h-screen bg-background pt-16 md:pt-24 pb-12 md:pb-16 font-sans selection:bg-muted-foreground/20">
        <div className="container mx-auto px-8 max-w-6xl">
          {/* Header */}
          <div className="mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4 md:mb-6">
              Data Deletion Policy
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
              Effective Date: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-12 md:space-y-16">
            
            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">1. Right to Erasure</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  KOVARI ("we", "us", "our") respects your privacy and your right to control your personal data. In strict compliance with global data protection frameworks (such as GDPR and CCPA), you have the right to request the permanent deletion of your personal data stored on our travel networking platform.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">2. How to Request Deletion</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">You can request the deletion of your KOVARI account and associated travel data through the following methods:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground mb-6">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Navigate to Settings {'>'} Account and select the "Delete Account" option.</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Send an email request from the email address associated with your KOVARI account to support@kovari.in with the subject line "Data Deletion Request".</li>
                </ul>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">3. What Data Gets Deleted</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">Upon receiving and verifying a valid deletion request, we will permanently delete or anonymize:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground mb-4">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Your user profile, verification documents, and personal identifiers (name, username, email, age)</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Authentication credentials associated with your account</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>User generated content, travel preferences, itineraries, and match history</li>
                </ul>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">4. Data We May Retain</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">We may retain certain localized data for a limited period, even after a deletion request, strictly for legitimate business or legal purposes, including:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground mb-4">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Anonymized analytics data that cannot identify you or your travels</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Information necessary to comply with legal, tax, or accounting obligations</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Data related to ongoing disputes, trust & safety investigations, or enforcement of our Terms of Service</li>
                </ul>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">5. Third-Party Service Providers</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  We will cascade your deletion instructions to our trusted third-party service providers (e.g., identity verification partners, authentication providers, databases) to ensure your data is scrubbed from their active systems in accordance with their respective compliance policies.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">6. Processing Time</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  We process data deletion requests as swiftly as possible. Account deletion initiated via the app settings is typically instantaneous. Requests submitted via email or subject to legal hold may take up to 30 days to fully propagate across all global systems, ledgers, and secure backups.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">7. Changes to Policy</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">We may update this Data Deletion Policy periodically. Any material changes will be reflected with an updated "Effective Date" at the top of this page.</p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">8. Contact Us</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  If you have any questions regarding your data, privacy, or account deletion, please contact us at:
                </p>
                <div className="text-base md:text-lg text-muted-foreground">
                  <p>
                    <a href="mailto:support@kovari.in" className="text-primary hover:text-primary/80 font-medium transition-colors border-b border-primary/20 hover:border-primary">support@kovari.in</a>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
