"use client";

import LegalLayout, { S, Bullet, Todo } from "./LegalLayout";

const SECTIONS = [
  { id: "introduction", title: "Introduction" },
  { id: "information-collected", title: "Information We Collect" },
  { id: "how-collected", title: "How We Collect Information" },
  { id: "why-collected", title: "Why We Collect Information" },
  { id: "authentication", title: "Authentication" },
  { id: "cookies", title: "Cookies" },
  { id: "analytics", title: "Analytics" },
  { id: "ai-usage", title: "AI and TruthGuide" },
  { id: "third-party", title: "Third-Party Services" },
  { id: "security", title: "Data Security" },
  { id: "rights", title: "Your Rights" },
  { id: "retention", title: "Data Retention" },
  { id: "children", title: "Children's Privacy" },
  { id: "updates", title: "Policy Updates" },
  { id: "contact", title: "Contact" },
];

export default function PrivacyContent() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How we collect, use, and protect your information when you use Truth Estate."
      breadcrumb="Privacy Policy"
      lastUpdated="28 June 2026"
      readingTime="9 min"
      version="1.0"
      sections={SECTIONS}
    >
      {/* Introduction */}
      <section id="introduction" className={S.section}>
        <h2 className={S.h2}>Introduction</h2>
        <div className={S.body}>
          <p>
            Truth Estate (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;) is committed to protecting the privacy of
            everyone who uses our platform and services. This policy explains
            what information we collect, how we use it, and how we keep it
            safe.
          </p>
          <p>
            This policy applies to all Truth Estate services including our
            website, Truth Intelligence, TruthGuide, and Private Office
            advisory services.
          </p>
        </div>
      </section>

      {/* Information We Collect */}
      <section id="information-collected" className={S.section}>
        <h2 className={S.h2}>Information We Collect</h2>
        <div className={S.body}>
          <p>
            We collect information in two broad categories: information you
            provide directly, and information collected automatically when you
            use our services.
          </p>
          <p><strong className="font-medium text-[#1a1a1a]/65">Information you provide</strong></p>
          <ul className={S.ul}>
            <Bullet>Name, email address, and phone number when you start a journey or request advice</Bullet>
            <Bullet>Property preferences, budget range, and location interests shared during consultations</Bullet>
            <Bullet>Questions and messages submitted through TruthGuide</Bullet>
            <Bullet>Correspondence when you contact us directly</Bullet>
          </ul>
          <p><strong className="font-medium text-[#1a1a1a]/65">Information collected automatically</strong></p>
          <ul className={S.ul}>
            <Bullet>Device type, browser, and operating system</Bullet>
            <Bullet>Pages visited, time spent, and interaction patterns</Bullet>
            <Bullet>IP address and approximate geographic location</Bullet>
            <Bullet>Referral source</Bullet>
          </ul>
        </div>
        <Todo>
          Finalise the complete list of data points collected once all product
          features are in production. Include any data collected via embedded
          third-party tools.
        </Todo>
      </section>

      {/* How We Collect Information */}
      <section id="how-collected" className={S.section}>
        <h2 className={S.h2}>How We Collect Information</h2>
        <div className={S.body}>
          <p>
            We collect information through the following methods:
          </p>
          <ul className={S.ul}>
            <Bullet>Forms and interactive journeys on our platform</Bullet>
            <Bullet>TruthGuide conversational interactions</Bullet>
            <Bullet>Cookies and similar browser-based technologies</Bullet>
            <Bullet>Analytics tools that observe aggregate usage patterns</Bullet>
            <Bullet>Direct communication via email, phone, or consultation sessions</Bullet>
          </ul>
          <p>
            We do not purchase personal information from third-party data
            brokers.
          </p>
        </div>
      </section>

      {/* Why We Collect Information */}
      <section id="why-collected" className={S.section}>
        <h2 className={S.h2}>Why We Collect Information</h2>
        <div className={S.body}>
          <p>We use your information to:</p>
          <ul className={S.ul}>
            <Bullet>Deliver personalised property research and recommendations</Bullet>
            <Bullet>Respond to your questions and advisory requests</Bullet>
            <Bullet>Improve TruthGuide&apos;s ability to provide relevant, evidence-based answers</Bullet>
            <Bullet>Understand how our services are used so we can improve them</Bullet>
            <Bullet>Communicate updates about research, services, or policy changes</Bullet>
            <Bullet>Ensure platform security and prevent misuse</Bullet>
          </ul>
          <p>
            We do not sell your personal information. We do not share your
            information with developers, brokers, or any other party for
            marketing purposes.
          </p>
        </div>
      </section>

      <div className={S.divider} />

      {/* Authentication */}
      <section id="authentication" className={S.section}>
        <h2 className={S.h2}>Authentication</h2>
        <div className={S.body}>
          <p>
            Certain features may require you to create an account or verify
            your identity. When you authenticate, we collect only the
            information necessary to establish and maintain your account.
          </p>
        </div>
        <Todo>
          Specify authentication provider(s) and the exact data exchanged
          during sign-in once the authentication system is implemented.
        </Todo>
      </section>

      {/* Cookies */}
      <section id="cookies" className={S.section}>
        <h2 className={S.h2}>Cookies</h2>
        <div className={S.body}>
          <p>
            We use cookies and similar technologies to remember your
            preferences, understand how you use our platform, and improve your
            experience.
          </p>
          <p>
            <strong className="font-medium text-[#1a1a1a]/65">Essential cookies</strong> are
            required for the platform to function correctly and cannot be
            disabled.
          </p>
          <p>
            <strong className="font-medium text-[#1a1a1a]/65">Analytics cookies</strong> help
            us understand usage patterns. These can be declined without
            affecting core functionality.
          </p>
          <p>
            We do not use advertising or tracking cookies from third-party ad
            networks.
          </p>
        </div>
        <Todo>
          Implement cookie consent banner and specify cookie names, purposes,
          and expiry periods in a detailed cookie table.
        </Todo>
      </section>

      {/* Analytics */}
      <section id="analytics" className={S.section}>
        <h2 className={S.h2}>Analytics</h2>
        <div className={S.body}>
          <p>
            We use analytics tools to understand aggregate usage patterns —
            which pages are most visited, how users navigate between sections,
            and where they encounter difficulties. This data is used to improve
            our research presentation and user experience.
          </p>
          <p>
            Analytics data is aggregated and anonymised wherever possible. We
            do not use analytics to build individual user profiles for
            advertising purposes.
          </p>
        </div>
        <Todo>
          Specify analytics provider (e.g. Plausible, PostHog, or Google
          Analytics) and confirm data processing agreements are in place.
        </Todo>
      </section>

      {/* AI and TruthGuide */}
      <section id="ai-usage" className={S.section}>
        <h2 className={S.h2}>AI and TruthGuide</h2>
        <div className={S.body}>
          <p>
            TruthGuide is an AI-powered research assistant. When you interact
            with TruthGuide, your questions and the context you provide are
            processed to generate relevant, evidence-based responses.
          </p>
          <ul className={S.ul}>
            <Bullet>Conversations may be reviewed to improve the quality and accuracy of responses</Bullet>
            <Bullet>We do not use your personal conversations to train general-purpose AI models</Bullet>
            <Bullet>TruthGuide responses are generated using our proprietary research data and independent analysis</Bullet>
          </ul>
        </div>
        <Todo>
          Confirm AI provider data processing terms. Specify whether
          conversations are stored, for how long, and whether they are shared
          with any third-party AI service provider.
        </Todo>
      </section>

      <div className={S.divider} />

      {/* Third-Party Services */}
      <section id="third-party" className={S.section}>
        <h2 className={S.h2}>Third-Party Services</h2>
        <div className={S.body}>
          <p>
            We use a limited number of third-party services to operate our
            platform. These services have access only to the information
            necessary to perform their functions and are contractually
            obligated to protect your data.
          </p>
          <ul className={S.ul}>
            <Bullet>Hosting and infrastructure providers</Bullet>
            <Bullet>Email delivery services for transactional communications</Bullet>
            <Bullet>Analytics tools for usage measurement</Bullet>
            <Bullet>Payment processors for advisory service fees</Bullet>
          </ul>
          <p>
            We do not share your personal information with third parties for
            their own marketing purposes.
          </p>
        </div>
        <Todo>
          List specific third-party sub-processors with their purposes and
          data processing locations.
        </Todo>
      </section>

      {/* Data Security */}
      <section id="security" className={S.section}>
        <h2 className={S.h2}>Data Security</h2>
        <div className={S.body}>
          <p>
            We implement appropriate technical and organisational measures to
            protect your information against unauthorised access, alteration,
            disclosure, or destruction. These measures include:
          </p>
          <ul className={S.ul}>
            <Bullet>Encryption of data in transit using TLS</Bullet>
            <Bullet>Access controls restricting data access to authorised personnel</Bullet>
            <Bullet>Regular security reviews of our systems and processes</Bullet>
          </ul>
          <p>
            No system is completely secure. While we take reasonable
            precautions, we cannot guarantee absolute security of your data.
          </p>
        </div>
      </section>

      {/* Your Rights */}
      <section id="rights" className={S.section}>
        <h2 className={S.h2}>Your Rights</h2>
        <div className={S.body}>
          <p>
            Depending on your jurisdiction, you may have the following rights
            regarding your personal information:
          </p>
          <ul className={S.ul}>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Access</strong> — request a copy of the personal information we hold about you</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Correction</strong> — request that we correct inaccurate or incomplete information</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Deletion</strong> — request that we delete your personal information, subject to legal retention requirements</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Portability</strong> — receive your data in a structured, machine-readable format</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Objection</strong> — object to certain types of processing</Bullet>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:privacy@truthestate.in" className={S.link}>
              privacy@truthestate.in
            </a>
            . We will respond within 30 days.
          </p>
        </div>
        <Todo>
          Confirm compliance requirements under the Digital Personal Data
          Protection Act 2023 (India) and specify the Data Protection Officer
          or Consent Manager once appointed.
        </Todo>
      </section>

      {/* Data Retention */}
      <section id="retention" className={S.section}>
        <h2 className={S.h2}>Data Retention</h2>
        <div className={S.body}>
          <p>
            We retain your personal information only for as long as necessary
            to provide our services and fulfil the purposes described in this
            policy, unless a longer retention period is required by law.
          </p>
          <p>
            When your data is no longer needed, we will securely delete or
            anonymise it.
          </p>
        </div>
        <Todo>
          Define specific retention periods for each data category (account
          data, TruthGuide conversations, analytics data, advisory records).
        </Todo>
      </section>

      {/* Children's Privacy */}
      <section id="children" className={S.section}>
        <h2 className={S.h2}>Children&apos;s Privacy</h2>
        <div className={S.body}>
          <p>
            Truth Estate is not intended for use by individuals under the age
            of 18. We do not knowingly collect personal information from
            children. If we become aware that we have collected information
            from a child, we will take steps to delete it promptly.
          </p>
        </div>
      </section>

      <div className={S.divider} />

      {/* Policy Updates */}
      <section id="updates" className={S.section}>
        <h2 className={S.h2}>Policy Updates</h2>
        <div className={S.body}>
          <p>
            We may update this privacy policy periodically. When we make
            material changes, we will notify you by updating the &ldquo;Last
            updated&rdquo; date at the top of this page and, where
            appropriate, by email or platform notification.
          </p>
          <p>
            We encourage you to review this policy periodically to stay
            informed about how we protect your information.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className={S.section}>
        <h2 className={S.h2}>Contact</h2>
        <div className={S.body}>
          <p>
            For privacy-related questions, requests, or concerns, contact our
            privacy team at{" "}
            <a href="mailto:privacy@truthestate.in" className={S.link}>
              privacy@truthestate.in
            </a>
          </p>
        </div>
        <Todo>
          Add registered business address, Data Protection Officer details,
          and Consent Manager information as required under the Digital
          Personal Data Protection Act 2023.
        </Todo>
      </section>
    </LegalLayout>
  );
}
