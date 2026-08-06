"use client";

import LegalLayout, { S, Bullet } from "./LegalLayout";

const SECTIONS = [
  { id: "introduction", title: "Introduction" },
  { id: "information-collected", title: "Information We Collect" },
  { id: "how-collected", title: "How We Collect Information" },
  { id: "why-collected", title: "Why We Collect Information" },
  { id: "legal-basis", title: "Our Legal Basis" },
  { id: "authentication", title: "Sign-In & Authentication" },
  { id: "cookies", title: "Cookies & Local Storage" },
  { id: "analytics", title: "Analytics" },
  { id: "ai-usage", title: "AI Features" },
  { id: "third-party", title: "Third-Party Services" },
  { id: "international", title: "Where Your Data Is Processed" },
  { id: "security", title: "Data Security" },
  { id: "rights", title: "Your Rights" },
  { id: "retention", title: "Data Retention" },
  { id: "children", title: "Children's Privacy" },
  { id: "grievance", title: "Grievance Redressal" },
  { id: "updates", title: "Policy Updates" },
  { id: "contact", title: "Contact" },
];

export default function PrivacyContent() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How we collect, use, and protect your information when you use Truth Estate."
      breadcrumb="Privacy Policy"
      lastUpdated="6 August 2026"
      readingTime="13 min"
      version="1.0"
      sections={SECTIONS}
    >
      {/* Introduction */}
      <section id="introduction" className={S.section}>
        <h2 className={S.h2}>Introduction</h2>
        <div className={S.body}>
          <p>
            Truth Estate (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;) — a private limited company incorporated in India
            and based in Gurugram, Haryana — is committed to protecting the
            privacy of everyone who uses our platform and services. This policy
            explains what information we collect, how we use it, who we share it
            with, and the choices and rights you have.
          </p>
          <p>
            It applies to all Truth Estate services, including our website at
            truthestate.in, Truth Intelligence, TruthGuide, and Private Office
            advisory services. For the purposes of India&apos;s Digital Personal
            Data Protection Act, 2023 (the &ldquo;DPDP Act&rdquo;), Truth Estate
            is the Data Fiduciary responsible for your personal data, and you are
            the Data Principal.
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
            <Bullet>Your mobile number, and — if you sign in with Google — your name, email address, and Google profile picture</Bullet>
            <Bullet>Your name and contact details when you request advice, book a call, unlock intelligence, or submit an enquiry</Bullet>
            <Bullet>Your property brief — budget, preferred locations, configuration, timeline, and what matters most to you — and any free-text notes you add</Bullet>
            <Bullet>Questions and messages you type into TruthGuide, the Truth Intelligence search, and the &ldquo;Challenge our read&rdquo; chat</Bullet>
            <Bullet>Homes you self-declare as owned or of interest, ratings, and feature requests</Bullet>
            <Bullet>Correspondence when you contact us directly</Bullet>
          </ul>
          <p><strong className="font-medium text-[#1a1a1a]/65">Information collected automatically</strong></p>
          <ul className={S.ul}>
            <Bullet>A random device identifier we generate to recognise your browser and stitch together your activity</Bullet>
            <Bullet>Pages and reports viewed, features used, and interaction patterns (including session replay — see Analytics)</Bullet>
            <Bullet>Device type, browser, operating system, and referring page</Bullet>
            <Bullet>Your IP address and the approximate location it implies, recorded in server logs</Bullet>
          </ul>
          <p>
            We do <strong className="font-medium text-[#1a1a1a]/65">not</strong> ask for or store your card,
            UPI, or bank details, and we do not knowingly collect special or
            sensitive categories of data. Please don&apos;t type sensitive
            personal information into chat or free-text fields.
          </p>
        </div>
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
            <Bullet>Signing in by mobile OTP or with your Google account</Bullet>
            <Bullet>TruthGuide, Truth Intelligence, and other conversational or search interactions</Bullet>
            <Bullet>Your browser&apos;s local storage and cookies set by the third-party tools we use</Bullet>
            <Bullet>Analytics tools that observe how the platform is used</Bullet>
            <Bullet>Direct communication via email, phone, or advisory sessions</Bullet>
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
            <Bullet>Create and secure your account and recognise you when you return</Bullet>
            <Bullet>Deliver personalised property research, shortlists, and recommendations</Bullet>
            <Bullet>Respond to your questions and advisory requests, and provide the services you pay for</Bullet>
            <Bullet>Generate answers in TruthGuide and Truth Intelligence, and improve their quality and accuracy</Bullet>
            <Bullet>Process payments and maintain invoices and financial records</Bullet>
            <Bullet>Understand how our services are used so we can improve them</Bullet>
            <Bullet>Communicate updates about research, services, or policy changes</Bullet>
            <Bullet>Keep the platform secure, prevent misuse, and meet legal obligations</Bullet>
          </ul>
          <p>
            We do not sell your personal information. We do not share it with
            developers, brokers, or any other party for their marketing
            purposes.
          </p>
        </div>
      </section>

      {/* Our Legal Basis */}
      <section id="legal-basis" className={S.section}>
        <h2 className={S.h2}>Our Legal Basis</h2>
        <div className={S.body}>
          <p>
            Under the DPDP Act, we process your personal data on the following
            bases:
          </p>
          <ul className={S.ul}>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Your consent</strong> — given when you sign in, submit a brief or enquiry, or use features such as analytics and AI. You can withdraw consent at any time (see Your Rights)</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">To provide what you ask for</strong> — where you voluntarily give us information for a specific purpose, such as unlocking a report or requesting advice, we process it to deliver that service</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Legal and legitimate uses</strong> — to comply with law (for example, tax and accounting records), to keep our platform secure, and for other uses permitted under applicable law</Bullet>
          </ul>
          <p>
            Withdrawing consent doesn&apos;t affect processing already carried
            out, and some data may be retained where the law requires it.
          </p>
        </div>
      </section>

      <div className={S.divider} />

      {/* Sign-In & Authentication */}
      <section id="authentication" className={S.section}>
        <h2 className={S.h2}>Sign-In &amp; Authentication</h2>
        <div className={S.body}>
          <p>
            We use Supabase Auth to manage sign-in. We offer passwordless
            options, so there is no password for you to create or for us to
            store:
          </p>
          <ul className={S.ul}>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Mobile OTP</strong> — we send a one-time code by SMS. Indian numbers are served through MSG91; international numbers through Twilio. These providers process your phone number to deliver the code</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Google Sign-In</strong> — with your permission, Google shares your name, email address, and profile picture with us to create your account</Bullet>
          </ul>
          <p>
            Your session is stored in your browser&apos;s local storage, not in
            a cookie, so you stay signed in on that device until you sign out.
          </p>
          <div className={S.note}>
            If you sign in by phone only, our system may create an internal
            placeholder email in the form phone_&lt;your number&gt;@truthestate.com.
            This is only an internal account label — it is not a real mailbox, we
            never send email to it, and you can ignore it.
          </div>
        </div>
      </section>

      {/* Cookies & Local Storage */}
      <section id="cookies" className={S.section}>
        <h2 className={S.h2}>Cookies &amp; Local Storage</h2>
        <div className={S.body}>
          <p>
            To keep you signed in and remember your brief and preferences, our
            own code stores information in your browser&apos;s{" "}
            <strong className="font-medium text-[#1a1a1a]/65">local storage</strong> rather than in
            cookies. This essential storage is needed for the platform to work
            and cannot be turned off while you use it; clearing your browser
            storage removes it.
          </p>
          <p>
            The third-party tools we load — Google Analytics, Amplitude,
            Razorpay checkout, and Google Maps — may set their own cookies or
            storage in your browser to perform their functions and measure
            usage. We do not use advertising or cross-site ad-tracking cookies
            from ad networks.
          </p>
          <p>
            You can clear or block cookies and site storage through your browser
            settings, and opt out of analytics as described below. Blocking
            essential storage may stop parts of the platform from working.
          </p>
        </div>
      </section>

      {/* Analytics */}
      <section id="analytics" className={S.section}>
        <h2 className={S.h2}>Analytics</h2>
        <div className={S.body}>
          <p>
            We use analytics to understand how our platform is used — which
            pages and reports are most useful, how people move through the site,
            and where they run into difficulty — so we can improve it. This
            involves three tools:
          </p>
          <ul className={S.ul}>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Our own event log</strong> — we record key actions (such as viewing a report, signing in, or completing a payment) with a device identifier, the page, and the referring source, stored in our own database</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Google Analytics</strong> — aggregate usage measurement provided by Google</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Amplitude</strong> — product analytics, including <em>session replay</em>, which reconstructs how a page looked and how you interacted with it (movements, clicks, scrolls, and taps) to help us find and fix usability issues. Keystrokes in sensitive fields are masked where supported</Bullet>
          </ul>
          <p>
            We use analytics to improve the product, not to build advertising
            profiles, and we do not sell this data. You can limit analytics
            using your browser&apos;s privacy controls or by contacting us at{" "}
            <a href="mailto:info@truthestate.in" className={S.link}>info@truthestate.in</a>.
          </p>
        </div>
      </section>

      {/* AI Features */}
      <section id="ai-usage" className={S.section}>
        <h2 className={S.h2}>AI Features</h2>
        <div className={S.body}>
          <p>
            Several features are AI-powered: TruthGuide and &ldquo;Challenge our
            read&rdquo; (chat), the Truth Intelligence search, and shortlist
            re-ranking. To generate responses, we send the text you type and the
            relevant research context to trusted AI providers:
          </p>
          <ul className={S.ul}>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Google (Gemini)</strong> — powers TruthGuide, the &ldquo;Challenge our read&rdquo; chat, and shortlist re-ranking</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Anthropic (Claude)</strong> — powers the Truth Intelligence search</Bullet>
          </ul>
          <ul className={S.ul}>
            <Bullet>We store your conversations and queries to provide the feature and improve its quality and accuracy</Bullet>
            <Bullet>We do not use your personal conversations to train general-purpose AI models, and our providers process this data under their own terms as our processors</Bullet>
            <Bullet>AI responses can be incomplete or wrong — verify anything important, and please don&apos;t enter sensitive personal information into AI features</Bullet>
          </ul>
        </div>
      </section>

      <div className={S.divider} />

      {/* Third-Party Services */}
      <section id="third-party" className={S.section}>
        <h2 className={S.h2}>Third-Party Services</h2>
        <div className={S.body}>
          <p>
            We rely on a limited set of service providers (processors) to
            operate our platform. Each receives only the information needed for
            its function and is expected to protect it:
          </p>
          <ul className={S.ul}>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Supabase</strong> — our database, authentication, and backend functions</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Google Cloud</strong> — website hosting (Cloud Run)</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Google Analytics &amp; Amplitude</strong> — usage analytics and session replay</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Razorpay</strong> — payment processing; it handles your card/UPI/bank details directly under its PCI-DSS-compliant systems</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Google Maps &amp; Places</strong> — maps and location search; your typed location queries are sent to Google, and a mapping CDN (CARTO) may serve fallback map tiles</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Google (Gemini) &amp; Anthropic (Claude)</strong> — the AI features above</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">MSG91 &amp; Twilio</strong> — sending sign-in codes by SMS</Bullet>
          </ul>
          <p>
            We do not share your personal information with third parties for
            their own marketing purposes. Each provider processes your data
            under its own privacy policy.
          </p>
        </div>
      </section>

      {/* Where Your Data Is Processed */}
      <section id="international" className={S.section}>
        <h2 className={S.h2}>Where Your Data Is Processed</h2>
        <div className={S.body}>
          <p>
            Truth Estate is based in India, but some of our providers process
            data outside India. Our website is served from Google Cloud in
            Singapore, and providers such as Google, Anthropic, Amplitude, and
            Twilio may process data in the United States or other countries.
            Razorpay processes payments in India.
          </p>
          <p>
            Where your personal data is transferred outside India, we do so in
            accordance with the DPDP Act and take reasonable steps to ensure it
            remains protected. By using our services, you consent to this
            processing and transfer.
          </p>
        </div>
      </section>

      {/* Data Security */}
      <section id="security" className={S.section}>
        <h2 className={S.h2}>Data Security</h2>
        <div className={S.body}>
          <p>
            We implement appropriate technical and organisational measures to
            protect your information against unauthorised access, alteration,
            disclosure, or destruction. These include:
          </p>
          <ul className={S.ul}>
            <Bullet>Encryption of data in transit using TLS, and encryption at rest by our infrastructure providers</Bullet>
            <Bullet>Row-level security in our database, so accounts can only access their own records</Bullet>
            <Bullet>Access controls restricting data access to authorised personnel</Bullet>
            <Bullet>Regular security reviews of our systems and processes</Bullet>
          </ul>
          <p>
            No system is completely secure. While we take reasonable
            precautions, we cannot guarantee absolute security. In the event of
            a personal data breach, we will notify the Data Protection Board of
            India and affected users as required by the DPDP Act.
          </p>
        </div>
      </section>

      {/* Your Rights */}
      <section id="rights" className={S.section}>
        <h2 className={S.h2}>Your Rights</h2>
        <div className={S.body}>
          <p>
            As a Data Principal under the DPDP Act, you have the right to:
          </p>
          <ul className={S.ul}>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Access</strong> — a summary of the personal data we hold about you and how we process it</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Correction &amp; completion</strong> — correct, complete, or update inaccurate or incomplete information</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Erasure</strong> — ask us to delete your personal data, subject to legal retention requirements</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Withdraw consent</strong> — withdraw consent as easily as you gave it</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Grievance redressal</strong> — have your complaints addressed by us (see below)</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Nominate</strong> — nominate another person to exercise your rights if you die or become incapacitated</Bullet>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:info@truthestate.in" className={S.link}>
              info@truthestate.in
            </a>
            . We will respond within a reasonable period and within any timeline
            required by law. You also have the right to complain to the Data
            Protection Board of India.
          </p>
        </div>
      </section>

      {/* Data Retention */}
      <section id="retention" className={S.section}>
        <h2 className={S.h2}>Data Retention</h2>
        <div className={S.body}>
          <p>
            We keep your personal data only for as long as necessary for the
            purposes in this policy, unless a longer period is required by law.
            As a guide:
          </p>
          <ul className={S.ul}>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Account &amp; brief</strong> — kept while your account is active, and deleted or anonymised when you ask us to close it</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Enquiries &amp; leads</strong> — up to 24 months after our last contact, unless part of an active engagement</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">AI conversations</strong> — up to 24 months, then deleted or anonymised</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Analytics</strong> — generally up to 26 months</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Payment &amp; invoice records</strong> — retained for about 8 years to meet Indian tax and accounting laws</Bullet>
          </ul>
          <p>
            When data is no longer needed, we securely delete or anonymise it.
          </p>
        </div>
      </section>

      {/* Children's Privacy */}
      <section id="children" className={S.section}>
        <h2 className={S.h2}>Children&apos;s Privacy</h2>
        <div className={S.body}>
          <p>
            Truth Estate is intended for adults making real estate decisions and
            is not directed at anyone under the age of 18. We do not knowingly
            collect personal data from children, and we do not knowingly track or
            serve targeted content to them. If you believe a child has provided
            us with personal data, contact us and we will delete it promptly.
          </p>
        </div>
      </section>

      {/* Grievance Redressal */}
      <section id="grievance" className={S.section}>
        <h2 className={S.h2}>Grievance Redressal</h2>
        <div className={S.body}>
          <p>
            If you have a concern or complaint about how we handle your personal
            data, please contact our Grievance Officer:
          </p>
          <ul className={S.ul}>
            <Bullet>Grievance Officer, Truth Estate</Bullet>
            <Bullet>Email: <a href="mailto:info@truthestate.in" className={S.link}>info@truthestate.in</a></Bullet>
            <Bullet>Gurugram, Haryana, India</Bullet>
          </ul>
          <p>
            We acknowledge grievances within 24 hours and endeavour to resolve
            them within a reasonable period, and within any timeline required by
            law. If you are not satisfied with our response, you may complain to
            the Data Protection Board of India.
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
            material changes, we will update the &ldquo;Last updated&rdquo; date
            at the top of this page and, where appropriate, notify you by email
            or platform notification.
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
            For privacy-related questions, requests, or concerns, contact us at{" "}
            <a href="mailto:info@truthestate.in" className={S.link}>
              info@truthestate.in
            </a>
            .
          </p>
          <p>
            Truth Estate · Gurugram, Haryana, India.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
