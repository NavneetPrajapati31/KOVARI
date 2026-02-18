import Footer from "@/shared/components/landing/Footer";
import React from "react";

export default function PrivacyPage() {
  const lastUpdated = "February 19, 2026";

  return (
    <>
      <div className="min-h-screen bg-background pt-16 md:pt-24 pb-12 md:pb-16 font-sans selection:bg-muted-foreground/20">
        <div className="container mx-auto px-8 max-w-[720px]">
          {/* Header */}
          <div className="mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4 md:mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-12 md:space-y-16">
            
            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">1. Overview</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  KOVARI (“we”, “our”) respects your privacy and is committed to protecting your personal data.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">2. Information We Collect</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-foreground mb-3">a. Information You Provide</h3>
                  <ul className="space-y-2 text-base md:text-lg text-muted-foreground">
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Name, username</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Email address</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Profile details (age, interests, preferences)</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Travel plans (destination, dates, budget)</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Messages and content shared</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-foreground mb-3">b. Automatically Collected</h3>
                  <ul className="space-y-2 text-base md:text-lg text-muted-foreground">
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Device and browser information</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>IP address</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Usage data (pages visited, actions)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">3. How We Use Your Data</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">We use your data to:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Provide and operate the platform</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Match you with relevant travelers</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Enable communication between users</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Improve features and performance</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Ensure safety and prevent misuse</li>
                </ul>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">4. Data Sharing</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-foreground mb-3">Service Providers:</h3>
                  <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">We share data with trusted providers who process data on our behalf:</p>
                  <ul className="space-y-2 text-base md:text-lg text-muted-foreground mb-4">
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Authentication (Clerk)</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Database (Supabase)</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Media (Cloudinary, Uploadthing)</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Email services (Brevo)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-foreground mb-3">Legal Requirements:</h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">We may disclose data if required by law.</p>
                </div>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">5. Data Storage & Security</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Data is stored securely using trusted third-party providers</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>We implement reasonable safeguards to protect your information</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>However, no system is 100% secure</li>
                </ul>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">6. User Communication</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Messages between users may be stored for functionality and safety</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>We may review content for moderation purposes</li>
                </ul>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">7. Your Rights</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">You can:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground mb-4">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Access your data</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Update your profile</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Request deletion of your account</li>
                </ul>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">8. Data Retention</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  We retain data as long as necessary to provide services and comply with legal obligations.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">9. Cookies & Tracking</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">We may use basic analytics and cookies to improve user experience.</p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">10. Third-Party Links</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">We are not responsible for third-party services or websites.</p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">11. Children’s Privacy</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">KOVARI is not intended for users under 18.</p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">12. Changes to Policy</h2>
              <div className="pl-1 border-l-2 border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">We may update this Privacy Policy periodically.</p>
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
