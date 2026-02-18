import Footer from "@/shared/components/landing/Footer";
import React from "react";

export default function PrivacyPage() {
  const lastUpdated = "February 19, 2026";

  return (
    <>
      <div className="min-h-screen bg-background pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="container mx-auto px-8 max-w-[800px]">
          {/* Header */}
          <div className="mb-10 md:mb-16 border-b pb-6 md:pb-8">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 md:space-y-12 text-sm md:text-base leading-relaxed text-muted-foreground">
            
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Overview</h2>
              <p>
                KOVARI (“we”, “our”) respects your privacy and is committed to protecting your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. Information We Collect</h2>
              
              <div className="mb-6">
                <h3 className="text-base font-medium text-foreground mb-2">a. Information You Provide</h3>
                <ul className="list-disc pl-5 space-y-1 marker:text-muted-foreground">
                  <li>Name, username</li>
                  <li>Email address</li>
                  <li>Profile details (age, interests, preferences)</li>
                  <li>Travel plans (destination, dates, budget)</li>
                  <li>Messages and content shared</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-medium text-foreground mb-2">b. Automatically Collected</h3>
                <ul className="list-disc pl-5 space-y-1 marker:text-muted-foreground">
                  <li>Device and browser information</li>
                  <li>IP address</li>
                  <li>Usage data (pages visited, actions)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Data</h2>
              <p className="mb-3">We use your data to:</p>
              <ul className="list-disc pl-5 space-y-1 marker:text-muted-foreground">
                <li>Provide and operate the platform</li>
                <li>Match you with relevant travelers</li>
                <li>Enable communication between users</li>
                <li>Improve features and performance</li>
                <li>Ensure safety and prevent misuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Sharing</h2>
              
              <div className="mb-6">
                <h3 className="text-base font-medium text-foreground mb-2">Service Providers:</h3>
                <p className="mb-2">We share data with trusted providers who process data on our behalf:</p>
                <ul className="list-disc pl-5 space-y-1 mb-4 marker:text-muted-foreground">
                  <li>Authentication (Clerk)</li>
                  <li>Database (Supabase)</li>
                  <li>Media (Cloudinary, Uploadthing)</li>
                  <li>Email services (Brevo)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-medium text-foreground mb-2">Legal Requirements:</h3>
                <p>We may disclose data if required by law.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Storage & Security</h2>
              <ul className="list-disc pl-5 space-y-1 marker:text-muted-foreground">
                <li>Data is stored securely using trusted third-party providers</li>
                <li>We implement reasonable safeguards to protect your information</li>
                <li>However, no system is 100% secure</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">6. User Communication</h2>
              <ul className="list-disc pl-5 space-y-1 marker:text-muted-foreground">
                <li>Messages between users may be stored for functionality and safety</li>
                <li>We may review content for moderation purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">7. Your Rights</h2>
              <p className="mb-3">You can:</p>
              <ul className="list-disc pl-5 space-y-1 mb-3 marker:text-muted-foreground">
                <li>Access your data</li>
                <li>Update your profile</li>
                <li>Request deletion of your account</li>
              </ul>
              {/* <p>
                To request deletion:{" "}
                <a href="mailto:support@kovari.com" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  support@kovari.com
                </a>
              </p> */}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">8. Data Retention</h2>
              <p>
                We retain data as long as necessary to provide services and comply with legal obligations.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">9. Cookies & Tracking</h2>
              <p>We may use basic analytics and cookies to improve user experience.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">10. Third-Party Links</h2>
              <p>We are not responsible for third-party services or websites.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">11. Children’s Privacy</h2>
              <p>KOVARI is not intended for users under 18.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">12. Changes to Policy</h2>
              <p>We may update this Privacy Policy periodically.</p>
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
