import Footer from "@/shared/components/landing/Footer";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how KOVARI protects your personal data and privacy. We prioritize your security as you connect with travel groups and plan your global adventures.",
};

export default function PrivacyPage() {
  const lastUpdated = "February 27, 2026";

  return (
    <>
      <div className="min-h-screen bg-background pt-16 md:pt-24 pb-12 md:pb-16 font-sans selection:bg-muted-foreground/20">
        <div className="container mx-auto px-8 max-w-6xl">
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
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">Introduction</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  KOVARI (“we”, “us”, or “our”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">Information We Collect</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-foreground mb-3">Personal Information</h3>
                  <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">We may collect personal information that you provide directly to us, such as:</p>
                  <ul className="space-y-2 text-base md:text-lg text-muted-foreground">
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Name and contact information (email address, phone number)</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Profile details and travel preferences</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Account credentials</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Payment information</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Communications with us</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-foreground mb-3">Automatically Collected Information</h3>
                  <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">When you use our services, we may automatically collect:</p>
                  <ul className="space-y-2 text-base md:text-lg text-muted-foreground">
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Device information (IP address, browser type, operating system)</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Usage data (pages visited, features used, time spent)</li>
                    <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">How We Use Your Information</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">We use the information we collect to:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Provide, maintain, and improve our services</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Process transactions and send related information</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Send technical notices, updates, and support messages</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Respond to your comments and questions</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Monitor and analyze trends, usage, and activities</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>Comply with legal obligations</li>
                </ul>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">Information Sharing</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">We do not sell, trade, or rent your personal information. We may share your information:</p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>With service providers who assist in our operations</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>For legal purposes or to protect rights and safety</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>In connection with a business transaction (merger, acquisition, etc.)</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>With your consent</li>
                </ul>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">Data Security</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
                  We implement appropriate technical and organizational measures designed to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  However, please note that no method of transmission over the Internet, or method of electronic storage, is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security and any transmission of personal information is at your own risk.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">Your Privacy Rights</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">
                  Depending on your location and applicable global privacy laws (including GDPR and CCPA), you may have the following rights regarding your personal information:
                </p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground mb-6">
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>The right to access and request a copy of the personal data we hold about you</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>The right to request that we correct or update any inaccurate or incomplete data</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>The right to request the deletion of your personal data ("right to be forgotten")</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>The right to object to or ask us to restrict the processing of your data</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>The right to data portability, allowing you to receive a copy of your personal data in a structured, machine-readable format</li>
                  <li className="flex items-start gap-3"><span className="select-none text-muted-foreground/40">•</span>The right to withdraw your consent at any time, where processing is based on consent</li>
                </ul>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  To exercise these rights, please contact us at <a href="mailto:support@kovari.in" className="text-primary hover:text-primary/80 font-medium transition-colors border-b border-primary/20 hover:border-primary">support@kovari.in</a>. We may need to verify your identity before fulfilling your request.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">Data Retention</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  We retain personal information for as long as necessary to provide our services and fulfill the purposes described in this Privacy Policy, unless a longer retention period is required or permitted by law.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">International Data Transfers</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  To securely provide our global services, your personal information may be transferred to, stored, and processed by our trusted cloud infrastructure providers in countries other than your country of residence. By using our services, you consent to these transfers, which are carried out utilizing legally compliant and universally accepted security safeguards.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">Third-Party Links</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Our services may contain links to third-party websites or services that are not owned or controlled by KOVARI. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. We strongly advise you to read the terms and conditions and privacy policies of any third-party websites or services that you visit.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">Children’s Privacy</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">Changes to This Policy</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the “Last updated” date.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-tight">Contact Us</h2>
              <div className="border-transparent group-hover:border-border/50 transition-colors duration-500">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at:
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
