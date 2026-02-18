import Footer from "@/shared/components/landing/Footer";
import React from "react";

export default function TermsPage() {
  const lastUpdated = "February 19, 2026";

  return (
    <>
      <div className="min-h-screen bg-background pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="container mx-auto px-8 max-w-[800px]">
          {/* Header */}
          <div className="mb-10 md:mb-16 border-b pb-6 md:pb-8">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-2">
              Terms of Service
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 md:space-y-12 text-sm md:text-base leading-relaxed text-muted-foreground">
            
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using KOVARI (“Platform”, “we”, “our”), you agree to be bound by these
                Terms of Service. If you do not agree, do not use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. Eligibility</h2>
              <p>
                You must be at least 18 years old to use KOVARI. By using the platform, you confirm
                that you meet this requirement.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. Nature of the Service</h2>
              <p className="mb-3">KOVARI is a technology platform that allows users to:</p>
              <ul className="list-disc pl-5 space-y-1 mb-4 marker:text-muted-foreground">
                <li>Discover and connect with other travelers</li>
                <li>Form travel groups (“travel circles”)</li>
                <li>Communicate and coordinate trips</li>
              </ul>
              <div className="bg-muted/40 border border-border/50 rounded-md p-4 text-sm md:text-base">
                <span className="font-medium text-foreground block mb-1">Important:</span>
                <p>
                  KOVARI does not organize trips, does not act as a travel agency, and does not verify or
                  guarantee user identity, behavior, or intentions.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. User Responsibility</h2>
              <p className="mb-3">You agree that:</p>
              <ul className="list-disc pl-5 space-y-1 mb-3 marker:text-muted-foreground">
                <li>You are solely responsible for your interactions with other users</li>
                <li>You evaluate the suitability, safety, and reliability of any travel companion</li>
                <li>You take appropriate precautions when meeting others</li>
              </ul>
              <p>KOVARI does not conduct background checks and does not guarantee safety.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. User Conduct</h2>
              <p className="mb-3">You agree NOT to:</p>
              <ul className="list-disc pl-5 space-y-1 mb-3 marker:text-muted-foreground">
                <li>Create fake or misleading profiles</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Engage in illegal activities</li>
                <li>Share harmful, offensive, or inappropriate content</li>
                <li>Use the platform for scams, fraud, or solicitation</li>
              </ul>
              <p>We reserve the right to suspend or terminate accounts violating these rules.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">6. Safety Disclaimer</h2>
              <p className="mb-3">KOVARI connects individuals who may meet offline. By using the platform, you acknowledge:</p>
              <ul className="list-disc pl-5 space-y-1 marker:text-muted-foreground">
                <li>You interact with others at your own risk</li>
                <li>KOVARI is not responsible for any incidents, disputes, or harm</li>
                <li>You are responsible for your personal safety decisions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">7. Content & Communication</h2>
              <ul className="list-disc pl-5 space-y-1 marker:text-muted-foreground">
                <li>You are responsible for content you share (messages, media, profile data)</li>
                <li>We may remove content that violates our policies</li>
                <li>We may monitor or review content for safety and moderation purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">8. Account Suspension & Termination</h2>
              <p className="mb-3">We may suspend or terminate accounts for:</p>
              <ul className="list-disc pl-5 space-y-1 mb-3 marker:text-muted-foreground">
                <li>Violations of these Terms</li>
                <li>Unsafe or suspicious behavior</li>
                <li>Reports from other users</li>
              </ul>
              <p>This may be done without prior notice.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">9. Limitation of Liability</h2>
              <p className="mb-3">To the maximum extent permitted by law, KOVARI shall not be liable for:</p>
              <ul className="list-disc pl-5 space-y-1 mb-3 marker:text-muted-foreground">
                <li>User interactions (online or offline)</li>
                <li>Personal injury, loss, or damages</li>
                <li>Disputes between users</li>
                <li>Travel-related issues</li>
              </ul>
              <p>You use the platform at your own risk.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">10. Indemnification</h2>
              <p className="mb-3">You agree to indemnify and hold KOVARI harmless from any claims, damages, or losses arising from:</p>
              <ul className="list-disc pl-5 space-y-1 marker:text-muted-foreground">
                <li>Your use of the platform</li>
                <li>Your interactions with other users</li>
                <li>Violation of these Terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">11. Modifications</h2>
              <p>
                We may update these Terms at any time. Continued use of the platform constitutes
                acceptance of updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">12. Governing Law</h2>
              <p>These Terms are governed by the laws of India.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">13. Contact</h2>
              <p className="mb-1">For any questions:</p>
              <a href="mailto:support@kovari.com" className="text-primary hover:text-primary/80 font-medium transition-colors">
                support@kovari.com
              </a>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
