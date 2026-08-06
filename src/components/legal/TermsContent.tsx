"use client";

import LegalLayout, { S, Bullet } from "./LegalLayout";
import { basePath } from "@/lib/site";

const SECTIONS = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "eligibility", title: "Eligibility" },
  { id: "accounts", title: "Accounts" },
  { id: "truth-intelligence", title: "Truth Intelligence" },
  { id: "truthguide", title: "TruthGuide" },
  { id: "private-office", title: "Private Office" },
  { id: "independent-advice", title: "Independent Advice" },
  { id: "payments", title: "Payments" },
  { id: "refunds", title: "Refunds" },
  { id: "subscriptions", title: "Memberships & Plans" },
  { id: "user-responsibilities", title: "User Responsibilities" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "third-party", title: "Third-Party Content" },
  { id: "termination", title: "Termination" },
  { id: "disclaimer", title: "Disclaimer" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "jurisdiction", title: "Governing Law & Disputes" },
  { id: "changes", title: "Changes to Terms" },
  { id: "contact", title: "Contact" },
];

export default function TermsContent() {
  return (
    <LegalLayout
      title="Terms of Use"
      description="The terms governing your use of Truth Estate's platform, research, and advisory services."
      breadcrumb="Terms of Use"
      lastUpdated="6 August 2026"
      readingTime="13 min"
      version="1.0"
      sections={SECTIONS}
    >
      {/* Acceptance */}
      <section id="acceptance" className={S.section}>
        <h2 className={S.h2}>Acceptance of Terms</h2>
        <div className={S.body}>
          <p>
            By accessing or using Truth Estate&apos;s website, platform, or any
            of our services, you agree to be bound by these Terms of Use. If
            you do not agree, please do not use our services.
          </p>
          <p>
            These terms constitute a legally binding agreement between you and
            Truth Estate, a private limited company incorporated in India and
            based in Gurugram, Haryana. We recommend reading them carefully,
            alongside our{" "}
            <a href={`${basePath}/privacy`} className={S.link}>Privacy Policy</a>{" "}
            and{" "}
            <a href={`${basePath}/disclaimer`} className={S.link}>Disclaimer</a>,
            which form part of these terms.
          </p>
        </div>
      </section>

      {/* Eligibility */}
      <section id="eligibility" className={S.section}>
        <h2 className={S.h2}>Eligibility</h2>
        <div className={S.body}>
          <p>
            You must be at least 18 years of age to use Truth Estate&apos;s
            services. By using our platform, you represent that you are 18 or
            older and have the legal capacity to enter into these terms.
          </p>
          <p>
            Our services are available to individuals and entities conducting
            property research or making real estate decisions in India.
          </p>
        </div>
      </section>

      {/* Accounts */}
      <section id="accounts" className={S.section}>
        <h2 className={S.h2}>Accounts</h2>
        <div className={S.body}>
          <p>
            Certain features require you to create an account. We offer
            passwordless sign-in: you can register and log in either with your
            mobile number and a one-time password (OTP) sent by SMS, or with
            your Google account. Authentication is handled by our identity
            provider, Supabase Auth; we do not ask you to create or remember a
            password.
          </p>
          <ul className={S.ul}>
            <Bullet>You are responsible for keeping access to your registered mobile number and Google account secure, and for all activity under your account</Bullet>
            <Bullet>An account is for a single individual; do not share access or let others transact under your account</Bullet>
            <Bullet>You agree to provide accurate, current, and complete information and to keep it up to date</Bullet>
            <Bullet>Notify us promptly at info@truthestate.in if you suspect any unauthorised use of your account</Bullet>
          </ul>
          <p>
            We may suspend or terminate accounts that contain false or
            misleading information, or that are used in breach of these terms.
          </p>
        </div>
      </section>

      <div className={S.divider} />

      {/* Truth Intelligence */}
      <section id="truth-intelligence" className={S.section}>
        <h2 className={S.h2}>Truth Intelligence</h2>
        <div className={S.body}>
          <p>
            Truth Intelligence is our independent research platform. It
            provides project assessments, developer analysis, market
            intelligence, Truth Scores, and Match Scores based on our
            proprietary research methodology.
          </p>
          <ul className={S.ul}>
            <Bullet>Research is published at our discretion and updated as new evidence becomes available</Bullet>
            <Bullet>Truth Scores and Match Scores represent our independent assessment and may change over time</Bullet>
            <Bullet>Research coverage does not imply endorsement of any project or developer</Bullet>
            <Bullet>Access to certain intelligence features may require a payment or advisory engagement</Bullet>
          </ul>
        </div>
      </section>

      {/* TruthGuide */}
      <section id="truthguide" className={S.section}>
        <h2 className={S.h2}>TruthGuide</h2>
        <div className={S.body}>
          <p>
            TruthGuide is an AI-powered research assistant that helps you
            explore our research and understand property-related information.
            When using TruthGuide:
          </p>
          <ul className={S.ul}>
            <Bullet>Responses are generated by an AI model and may not cover every relevant consideration, and may occasionally be incomplete or incorrect</Bullet>
            <Bullet>TruthGuide is designed to explain and inform, not to persuade or recommend specific transactions</Bullet>
            <Bullet>AI-generated responses should be verified against primary sources for important decisions</Bullet>
            <Bullet>Your questions are processed to generate answers and may be used to improve response quality, as described in our Privacy Policy — please do not enter sensitive personal information into the chat</Bullet>
          </ul>
          <p>
            TruthGuide does not constitute professional advice. See our{" "}
            <a href={`${basePath}/disclaimer`} className={S.link}>
              Disclaimer
            </a>{" "}
            for important limitations.
          </p>
        </div>
      </section>

      {/* Private Office */}
      <section id="private-office" className={S.section}>
        <h2 className={S.h2}>Private Office</h2>
        <div className={S.body}>
          <p>
            Private Office is our independent buyer-representation service,
            providing dedicated advisory support from research through to
            decision. Private Office engagements are subject to separate
            engagement terms — covering scope, fees, timeline, and deliverables
            — which are provided to you when you engage our advisory services.
            In the event of any conflict, those engagement terms govern the
            specific advisory relationship, and these Terms of Use apply to
            everything else.
          </p>
        </div>
      </section>

      {/* Independent Advice */}
      <section id="independent-advice" className={S.section}>
        <h2 className={S.h2}>Independent Advice</h2>
        <div className={S.body}>
          <p>
            Truth Estate operates independently. We are not affiliated with
            any developer, broker, financial institution, or property portal,
            and we do not earn brokerage or commission on any transaction. Our
            advisory services are designed to represent the buyer&apos;s
            interest.
          </p>
          <p>
            While we provide research-backed analysis and recommendations, all
            advisory output is subject to the limitations described in our{" "}
            <a href={`${basePath}/disclaimer`} className={S.link}>
              Disclaimer
            </a>
            . We strongly encourage you to supplement our analysis with
            independent professional advice.
          </p>
        </div>
      </section>

      <div className={S.divider} />

      {/* Payments */}
      <section id="payments" className={S.section}>
        <h2 className={S.h2}>Payments</h2>
        <div className={S.body}>
          <p>
            Certain Truth Estate services require payment. All fees are clearly
            disclosed before you incur any charge. Payments are processed by
            Razorpay, a third-party payment processor; by paying, you also agree
            to Razorpay&apos;s terms.
          </p>
          <ul className={S.ul}>
            <Bullet>Prices are quoted in Indian Rupees (INR) unless otherwise stated</Bullet>
            <Bullet>Applicable taxes, including GST, are added as required by law</Bullet>
            <Bullet>You can pay using the methods Razorpay supports — such as cards, UPI, net banking, and wallets</Bullet>
            <Bullet>We do not receive or store your full card or bank credentials; these are handled directly by Razorpay under its PCI-DSS-compliant systems. We retain a record of the transaction (such as amount, date, and what it was for) for accounting and support</Bullet>
          </ul>
        </div>
      </section>

      {/* Refunds */}
      <section id="refunds" className={S.section}>
        <h2 className={S.h2}>Refunds</h2>
        <div className={S.body}>
          <p>
            Our services deliver digital research and advisory work, much of it
            accessible immediately on payment. Our refund policy reflects that:
          </p>
          <ul className={S.ul}>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Unlocked reports and intelligence</strong> — because access is granted instantly and the content is consumed on unlock, these fees are non-refundable once the report or intelligence has been unlocked</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Duplicate or erroneous charges</strong> — refunded in full</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Content we could not deliver</strong> — if a report you paid for could not be accessed due to a fault on our side and we cannot resolve it, we refund that fee</Bullet>
            <Bullet><strong className="font-medium text-[#1a1a1a]/65">Advisory &amp; Private Office</strong> — governed by your engagement terms; fees for work already performed are non-refundable, and any unused portion is handled as set out in those terms</Bullet>
          </ul>
          <p>
            For any billing question or refund request, contact{" "}
            <a href="mailto:info@truthestate.in" className={S.link}>info@truthestate.in</a>{" "}
            within 7 days of the charge. Nothing here limits any refund or
            remedy you are entitled to under applicable law, including the
            Consumer Protection Act, 2019. Approved refunds are returned to your
            original payment method via Razorpay.
          </p>
        </div>
      </section>

      {/* Memberships & Plans */}
      <section id="subscriptions" className={S.section}>
        <h2 className={S.h2}>Memberships &amp; Plans</h2>
        <div className={S.body}>
          <p>
            Where we offer a membership or plan — for example an all-access plan
            or an advisory retainer — the price, what it includes, the billing
            frequency, and the renewal and cancellation terms are shown before
            you pay.
          </p>
          <p>
            If a plan renews automatically, we tell you before you buy, and you
            can turn off renewal at any time from your account or by contacting
            us. Cancellation takes effect at the end of the current billing
            period; unless required by law, fees for a billing period already
            started are not refunded.
          </p>
        </div>
      </section>

      {/* User Responsibilities */}
      <section id="user-responsibilities" className={S.section}>
        <h2 className={S.h2}>User Responsibilities</h2>
        <div className={S.body}>
          <p>When using Truth Estate, you agree to:</p>
          <ul className={S.ul}>
            <Bullet>Use our services only for lawful purposes and in accordance with these terms</Bullet>
            <Bullet>Provide accurate information in all interactions with our platform</Bullet>
            <Bullet>Not attempt to reverse-engineer, scrape, or systematically extract our research data</Bullet>
            <Bullet>Not misrepresent Truth Estate research as your own or use it for commercial redistribution</Bullet>
            <Bullet>Not interfere with the security or operation of our platform</Bullet>
            <Bullet>Respect the intellectual property rights described below</Bullet>
          </ul>
        </div>
      </section>

      {/* Intellectual Property */}
      <section id="intellectual-property" className={S.section}>
        <h2 className={S.h2}>Intellectual Property</h2>
        <div className={S.body}>
          <p>
            All content on the Truth Estate platform — including research
            reports, Truth Scores, Match Scores, TruthGuide responses,
            methodology descriptions, design elements, and software — is the
            intellectual property of Truth Estate and is protected by
            applicable copyright and intellectual property laws.
          </p>
          <p>
            You may access and use our published content for personal,
            non-commercial purposes. Any reproduction, distribution, or
            commercial use requires our prior written consent.
          </p>
          <p>
            &ldquo;Truth Estate,&rdquo; &ldquo;Truth Intelligence,&rdquo;
            &ldquo;TruthGuide,&rdquo; &ldquo;Truth Score,&rdquo; and
            &ldquo;Match Score&rdquo; are trademarks of Truth Estate, whether
            registered or unregistered.
          </p>
        </div>
      </section>

      {/* Third-Party Content */}
      <section id="third-party" className={S.section}>
        <h2 className={S.h2}>Third-Party Content</h2>
        <div className={S.body}>
          <p>
            Our platform may contain links to third-party websites or
            reference information from external sources. We do not control,
            endorse, or assume responsibility for the content, privacy
            policies, or practices of any third-party sites or services.
          </p>
          <p>
            Our use of third-party data in our research is subject to the
            accuracy limitations described in our{" "}
            <a href={`${basePath}/disclaimer`} className={S.link}>
              Disclaimer
            </a>
            .
          </p>
        </div>
      </section>

      <div className={S.divider} />

      {/* Termination */}
      <section id="termination" className={S.section}>
        <h2 className={S.h2}>Termination</h2>
        <div className={S.body}>
          <p>
            We may suspend or terminate your access to Truth Estate at any
            time, with or without cause, if we believe you have violated these
            terms or if continued access would be harmful to our platform or
            other users.
          </p>
          <p>
            You may stop using our services at any time. Upon termination,
            your right to access our platform ceases, but provisions that by
            their nature should survive (such as intellectual property rights,
            limitation of liability, and dispute resolution) will continue to
            apply.
          </p>
        </div>
      </section>

      {/* Disclaimer */}
      <section id="disclaimer" className={S.section}>
        <h2 className={S.h2}>Disclaimer</h2>
        <div className={S.body}>
          <p>
            Truth Estate&apos;s services are provided &ldquo;as is&rdquo; and
            &ldquo;as available&rdquo; without warranties of any kind, whether
            express or implied, including but not limited to implied warranties
            of merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>
          <p>
            We do not warrant that our services will be uninterrupted, error-free,
            or completely secure, or that any information provided will be
            accurate or complete. For a detailed explanation of the limitations
            of our information, please refer to our full{" "}
            <a href={`${basePath}/disclaimer`} className={S.link}>
              Disclaimer
            </a>
            .
          </p>
        </div>
      </section>

      {/* Limitation of Liability */}
      <section id="liability" className={S.section}>
        <h2 className={S.h2}>Limitation of Liability</h2>
        <div className={S.body}>
          <p>
            To the maximum extent permitted by applicable law, Truth Estate
            shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, or any loss of profits,
            revenue, data, or goodwill, arising from or related to your use of
            our services.
          </p>
          <p>
            Our total liability for any claim arising from these terms or your
            use of our services shall not exceed the amount you have paid to
            Truth Estate in the twelve months preceding the claim.
          </p>
          <p>
            Nothing in these terms excludes or limits any liability that cannot
            be excluded or limited under applicable law, including liability for
            fraud or under the Consumer Protection Act, 2019.
          </p>
        </div>
      </section>

      {/* Governing Law & Disputes */}
      <section id="jurisdiction" className={S.section}>
        <h2 className={S.h2}>Governing Law &amp; Disputes</h2>
        <div className={S.body}>
          <p>
            These terms are governed by and construed in accordance with the
            laws of India.
          </p>
          <p>
            If a dispute arises, we ask that you first contact us at{" "}
            <a href="mailto:info@truthestate.in" className={S.link}>info@truthestate.in</a>{" "}
            so we can try to resolve it in good faith. Any dispute that cannot
            be resolved may be referred to arbitration by a sole arbitrator
            under the Arbitration and Conciliation Act, 1996, with the seat and
            venue of arbitration at Gurugram, Haryana, and proceedings conducted
            in English. Subject to arbitration, the courts at Gurugram, Haryana
            have exclusive jurisdiction. Nothing in this clause prevents a
            consumer from exercising rights or remedies available under the
            Consumer Protection Act, 2019.
          </p>
        </div>
      </section>

      <div className={S.divider} />

      {/* Changes */}
      <section id="changes" className={S.section}>
        <h2 className={S.h2}>Changes to Terms</h2>
        <div className={S.body}>
          <p>
            We may revise these terms from time to time. When we make material
            changes, we will update the &ldquo;Last updated&rdquo; date and
            notify you by email or through a prominent notice on our platform.
          </p>
          <p>
            Your continued use of Truth Estate after revised terms are
            published constitutes acceptance of the updated terms. If you do
            not agree to the revised terms, you should discontinue use of our
            services.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className={S.section}>
        <h2 className={S.h2}>Contact</h2>
        <div className={S.body}>
          <p>
            For questions about these terms, or to raise a grievance, contact
            our Grievance Officer at{" "}
            <a href="mailto:info@truthestate.in" className={S.link}>
              info@truthestate.in
            </a>
            . We acknowledge grievances within 24 hours and endeavour to resolve
            them within 15 days, in line with applicable law.
          </p>
          <p>
            Truth Estate · Gurugram, Haryana, India.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
