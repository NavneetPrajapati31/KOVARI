import Footer from "@/shared/components/landing/Footer";
import React from "react";

export default function TermsPage() {
  const lastUpdated = "February 19, 2026";

  return (
    <>
      <div className="min-h-screen bg-background pt-16 md:pt-24 pb-12 md:pb-16 font-sans selection:bg-muted-foreground/20">
        <div className="container mx-auto px-8 max-w-[720px]">
          {/* Header */}
          <div className="mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4 md:mb-6">
              Terms of Service
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-12 md:space-y-16">
            
            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">1. Acceptance of Terms</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  By accessing or using KOVARI (“Platform”, “we”, “our”), you agree to be bound by these
                  Terms of Service. If you do not agree, do not use the platform.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">2. Eligibility</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  You must be at least 18 years old to use KOVARI. By using the platform, you confirm
                  that you meet this requirement.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">3. Nature of the Service</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">KOVARI is a technology platform that allows users to:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground mb-6">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Discover and connect with other travelers</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Form travel groups (“travel circles”)</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Communicate and coordinate trips</li>
                </ul>
                <div className="bg-muted/30 p-6 rounded-lg border border-border/40">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-primary/20 pb-1 mb-2 inline-block text-primary">Important</span>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    KOVARI does not organize trips, does not act as a travel agency, and does not verify or
                    guarantee user identity, behavior, or intentions.
                  </p>
                </div>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">4. User Responsibility</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">You agree that:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground mb-4">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>You are solely responsible for your interactions with other users</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>You evaluate the suitability, safety, and reliability of any travel companion</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>You take appropriate precautions when meeting others</li>
                </ul>
                <p className="text-base md:text-lg text-muted-foreground italic leading-relaxed">KOVARI does not conduct background checks and does not guarantee safety.</p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">5. User Conduct</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">You agree NOT to:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground mb-4">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Create fake or misleading profiles</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Harass, abuse, or harm other users</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Engage in illegal activities</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Share harmful, offensive, or inappropriate content</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Use the platform for scams, fraud, or solicitation</li>
                </ul>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">We reserve the right to suspend or terminate accounts violating these rules.</p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">6. Safety Disclaimer</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">KOVARI connects individuals who may meet offline. By using the platform, you acknowledge:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>You interact with others at your own risk</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>KOVARI is not responsible for any incidents, disputes, or harm</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>You are responsible for your personal safety decisions</li>
                </ul>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">7. Content & Communication</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>You are responsible for content you share (messages, media, profile data)</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>We may remove content that violates our policies</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>We may monitor or review content for safety and moderation purposes</li>
                </ul>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">8. Account Suspension & Termination</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">We may suspend or terminate accounts for:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground mb-4">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Violations of these Terms</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Unsafe or suspicious behavior</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Reports from other users</li>
                </ul>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">This may be done without prior notice.</p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">9. Limitation of Liability</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">To the maximum extent permitted by law, KOVARI shall not be liable for:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground mb-4">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>User interactions (online or offline)</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Personal injury, loss, or damages</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Disputes between users</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Travel-related issues</li>
                </ul>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">You use the platform at your own risk.</p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">10. Indemnification</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">You agree to indemnify and hold KOVARI harmless from any claims, damages, or losses arising from:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Your use of the platform</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Your interactions with other users</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Violation of these Terms</li>
                </ul>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">11. Modifications</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  We may update these Terms at any time. Continued use of the platform constitutes
                  acceptance of updated terms.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">12. Governing Law</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">These Terms are governed by the laws of India.</p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">13. Contact</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-2 leading-relaxed">For any questions:</p>
                <a href="mailto:support@kovari.in" className="text-base md:text-lg text-primary hover:text-primary/80 font-medium transition-colors border-b border-primary/20 hover:border-primary">
                  support@kovari.in
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
