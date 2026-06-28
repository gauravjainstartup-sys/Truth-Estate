"use client";

import LegalLayout, { S, Bullet, Todo } from "./LegalLayout";

const SECTIONS = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "eligibility", title: "Eligibility" },
  { id: "accounts", title: "Accounts" },
  { id: "truth-intelligence", title: "Truth Intelligence" },
  { id: "truthguide", title: "TruthGuide" },
  { id: "private-office", title: "Private Office" },
  { id: "independent-advice", title: "Independent Advice" },
  { id: "payments", title: "Payments" },
  { id: "subscriptions", title: "Subscriptions" },
  { id: "user-responsibilities", title: "User Responsibilities" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "third-party", title: "Third-Party Content" },
  { id: "termination", title: "Termination" },
  { id: "disclaimer", title: "Disclaimer" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "jurisdiction", title: "Governing Law" },
  { id: "changes", title: "Changes to Terms" },
  { id: "contact", title: "Contact" },
];

export default function TermsContent() {
  return (
    <LegalLayout
      title="Terms of Use"
      description="The terms governing your use of Truth Estate's platform, research, and advisory services."
      breadcrumb="Terms of Use"
      lastUpdated="28 June 2026"
      readingTime="12 min"
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
            Truth Estate. We recommend reading them carefully.
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
            Certain features may require you to create an account. You are
            responsible for maintaining the confidentiality of your account
            credentials and for all activity that occurs under your account.
          </p>
          <p>
            You agree to provide accurate, current, and complete information
            during registration and to update your information as needed. We
            reserve the right to suspend or terminate accounts that contain
            false or misleading information.
          </p>
        </div>
        <Todo>
          Specify account creation flow, authentication method, and
          password/security requirements once the user authentication system
          is implemented.
        </Todo>
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
            <Bullet>Access to certain intelligence features may require a subscription or advisory engagement</Bullet>
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
            <Bullet>Responses are generated based on our research data and may not cover every relevant consideration</Bullet>
            <Bullet>TruthGuide is designed to explain and inform, not to persuade or recommend specific transactions</Bullet>
            <Bullet>AI-generated responses should be verified against primary sources for important decisions</Bullet>
            <Bullet>Your interactions may be used to improve response quality, subject to our Privacy Policy</Bullet>
          </ul>
          <p>
            TruthGuide does not constitute professional advice. See our{" "}
            <a href="/Truth-Estate/disclaimer" className={S.link}>
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
            Private Office is our independent buyer representation service,
            providing dedicated advisory support from research through to
            decision. Private Office engagements are subject to separate
            service agreements that will be provided when you engage our
            advisory services.
          </p>
        </div>
        <Todo>
          Draft the Private Office service agreement template. Define scope of
          services, advisory fee structure, engagement timeline, and
          deliverables.
        </Todo>
      </section>

      {/* Independent Advice */}
      <section id="independent-advice" className={S.section}>
        <h2 className={S.h2}>Independent Advice</h2>
        <div className={S.body}>
          <p>
            Truth Estate operates independently. We are not affiliated with
            any developer, broker, financial institution, or property portal.
            Our advisory services are designed to represent the buyer&apos;s
            interest.
          </p>
          <p>
            While we provide research-backed analysis and recommendations, all
            advisory output is subject to the limitations described in our{" "}
            <a href="/Truth-Estate/disclaimer" className={S.link}>
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
            Certain Truth Estate services require payment. All fees will be
            clearly disclosed before you incur any charges. Payments are
            processed through secure third-party payment processors.
          </p>
          <ul className={S.ul}>
            <Bullet>Prices are quoted in Indian Rupees (INR) unless otherwise stated</Bullet>
            <Bullet>Applicable taxes (GST) will be added as required by law</Bullet>
            <Bullet>Refund policies vary by service and will be specified at the time of purchase</Bullet>
          </ul>
        </div>
        <Todo>
          Specify payment processor, accepted payment methods, refund policy
          details, and cancellation terms once the payment system is
          implemented.
        </Todo>
      </section>

      {/* Subscriptions */}
      <section id="subscriptions" className={S.section}>
        <h2 className={S.h2}>Subscriptions</h2>
        <div className={S.body}>
          <p>
            Some services may be offered on a subscription basis. Subscription
            terms, including billing frequency, renewal procedures, and
            cancellation rights, will be clearly presented before you
            subscribe.
          </p>
          <p>
            You may cancel a subscription at any time. Cancellation will take
            effect at the end of the current billing period.
          </p>
        </div>
        <Todo>
          Define subscription tiers, pricing, billing cycles, trial periods,
          and auto-renewal terms once the subscription model is finalised.
        </Todo>
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
            &ldquo;Match Score&rdquo; are trademarks of Truth Estate.
          </p>
        </div>
        <Todo>
          Confirm trademark registration status and filing jurisdictions.
        </Todo>
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
            <a href="/Truth-Estate/disclaimer" className={S.link}>
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
            <a href="/Truth-Estate/disclaimer" className={S.link}>
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
        </div>
        <Todo>
          Legal review required: ensure limitation of liability clauses are
          enforceable under Indian Consumer Protection Act 2019 and the Indian
          Contract Act 1872.
        </Todo>
      </section>

      {/* Governing Law */}
      <section id="jurisdiction" className={S.section}>
        <h2 className={S.h2}>Governing Law</h2>
        <div className={S.body}>
          <p>
            These terms are governed by and construed in accordance with the
            laws of India. Any disputes arising from these terms or your use of
            Truth Estate shall be subject to the exclusive jurisdiction of the
            courts in Gurugram, Haryana, India.
          </p>
        </div>
        <Todo>
          Confirm registered jurisdiction once company incorporation is
          finalised. Consider adding an arbitration clause.
        </Todo>
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
            For questions about these terms, contact us at{" "}
            <a href="mailto:legal@truthestate.in" className={S.link}>
              legal@truthestate.in
            </a>
          </p>
        </div>
        <Todo>
          Add registered business address, company registration number, and
          grievance officer details as required by the Information Technology
          (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021.
        </Todo>
      </section>
    </LegalLayout>
  );
}
