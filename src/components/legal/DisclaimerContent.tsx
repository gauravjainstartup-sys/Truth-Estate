"use client";

import LegalLayout, { S, Bullet, Todo } from "./LegalLayout";

const SECTIONS = [
  { id: "introduction", title: "Introduction" },
  { id: "nature", title: "Nature of Information" },
  { id: "research", title: "Independent Research" },
  { id: "no-investment", title: "No Investment Advice" },
  { id: "no-legal", title: "No Legal Advice" },
  { id: "no-financial", title: "No Financial Advice" },
  { id: "accuracy", title: "Accuracy of Information" },
  { id: "third-party", title: "Third-Party Sources" },
  { id: "responsibility", title: "Personal Responsibility" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "changes", title: "Changes" },
  { id: "contact", title: "Contact" },
];

export default function DisclaimerContent() {
  return (
    <LegalLayout
      title="Disclaimer"
      description="What Truth Estate is, what it is not, and the boundaries of the information we provide."
      breadcrumb="Disclaimer"
      lastUpdated="28 June 2026"
      readingTime="6 min"
      version="1.0"
      sections={SECTIONS}
    >
      {/* Introduction */}
      <section id="introduction" className={S.section}>
        <h2 className={S.h2}>Introduction</h2>
        <div className={S.body}>
          <p>
            Truth Estate (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
            operates an independent real estate research and advisory platform
            accessible at truthestate.in and through related services including
            Truth Intelligence, TruthGuide, and Private Office.
          </p>
          <p>
            This disclaimer explains the nature and limitations of the
            information we publish. By accessing any of our services, you
            acknowledge that you have read and understood the terms set out
            below.
          </p>
        </div>
      </section>

      {/* Nature of Information */}
      <section id="nature" className={S.section}>
        <h2 className={S.h2}>Nature of Information</h2>
        <div className={S.body}>
          <p>
            All content published by Truth Estate — including project
            intelligence reports, developer assessments, market analysis, Truth
            Scores, Match Scores, and TruthGuide responses — is provided for
            general informational and educational purposes only.
          </p>
          <p>
            Our research represents our independent analysis at the time of
            publication. It is not a substitute for professional advice tailored
            to your individual circumstances, and should not be relied upon as
            the sole basis for any property purchase, investment, or financial
            decision.
          </p>
        </div>
      </section>

      {/* Independent Research */}
      <section id="research" className={S.section}>
        <h2 className={S.h2}>Independent Research</h2>
        <div className={S.body}>
          <p>
            Truth Estate conducts independent research using publicly available
            regulatory filings, financial disclosures, legal records, market
            data, and ground-level verification. We are not affiliated with,
            sponsored by, or compensated by any real estate developer, broker,
            or financial institution.
          </p>
          <p>
            Our research methodology involves both technology-assisted analysis
            and human judgement. While we strive for accuracy and thoroughness,
            independent research inherently involves interpretation and
            professional judgement, which may differ from other assessments.
          </p>
        </div>
      </section>

      {/* No Investment Advice */}
      <section id="no-investment" className={S.section}>
        <h2 className={S.h2}>No Investment Advice</h2>
        <div className={S.body}>
          <p>
            Nothing published by Truth Estate constitutes investment advice.
            Real estate purchases involve significant financial commitments and
            risks that depend on your personal financial situation, risk
            tolerance, investment horizon, and other factors that we cannot
            assess on your behalf.
          </p>
          <p>
            We strongly recommend that you consult a qualified financial
            advisor before making any property investment decision, regardless
            of the information or analysis we provide.
          </p>
        </div>
        <Todo>
          Confirm SEBI/RBI regulatory language requirements for investment
          disclaimers applicable to real estate advisory platforms operating in
          India.
        </Todo>
      </section>

      {/* No Legal Advice */}
      <section id="no-legal" className={S.section}>
        <h2 className={S.h2}>No Legal Advice</h2>
        <div className={S.body}>
          <p>
            Truth Estate does not provide legal advice. Our analysis of
            regulatory filings, RERA registrations, land records, and legal
            documentation is conducted for informational purposes and does not
            constitute legal counsel.
          </p>
          <p>
            Property transactions in India involve complex legal
            considerations including title verification, encumbrance checks,
            regulatory compliance, and contractual obligations. We recommend
            engaging a qualified property lawyer before executing any property
            transaction.
          </p>
        </div>
      </section>

      {/* No Financial Advice */}
      <section id="no-financial" className={S.section}>
        <h2 className={S.h2}>No Financial Advice</h2>
        <div className={S.body}>
          <p>
            Our analysis of pricing, payment plans, loan eligibility, or
            financial projections is intended to inform, not to advise. We do
            not assess your ability to finance a purchase, nor do we make
            recommendations regarding mortgage products, loan structures, or
            tax implications.
          </p>
          <p>
            Consult a chartered accountant or financial planner for advice
            specific to your financial circumstances.
          </p>
        </div>
      </section>

      <div className={S.divider} />

      {/* Accuracy of Information */}
      <section id="accuracy" className={S.section}>
        <h2 className={S.h2}>Accuracy of Information</h2>
        <div className={S.body}>
          <p>
            We make reasonable efforts to ensure that the information we
            publish is accurate and current. However, the real estate market is
            dynamic, and information can change rapidly. We do not warrant
            that:
          </p>
          <ul className={S.ul}>
            <Bullet>All information is complete, accurate, or up to date at the time you access it</Bullet>
            <Bullet>Prices, availability, or project details have not changed since our last update</Bullet>
            <Bullet>Regulatory information reflects the most recent filings or amendments</Bullet>
            <Bullet>Our analysis will align with assessments from other sources</Bullet>
          </ul>
          <p>
            Where we identify errors or material changes, we update our
            research as promptly as practicable.
          </p>
        </div>
      </section>

      {/* Third-Party Sources */}
      <section id="third-party" className={S.section}>
        <h2 className={S.h2}>Third-Party Sources</h2>
        <div className={S.body}>
          <p>
            Our research draws on data from government regulators, financial
            databases, court records, and other third-party sources. While we
            verify information across multiple sources wherever possible, we
            cannot guarantee the accuracy or completeness of data originating
            from external parties.
          </p>
          <p>
            References to third-party organisations, projects, or services do
            not imply endorsement, affiliation, or partnership unless
            explicitly stated.
          </p>
        </div>
      </section>

      {/* Personal Responsibility */}
      <section id="responsibility" className={S.section}>
        <h2 className={S.h2}>Personal Responsibility</h2>
        <div className={S.body}>
          <p>
            You are responsible for your own due diligence. Truth Estate
            provides research and analysis to support your decision-making
            process, but the final decision to purchase, invest in, or
            otherwise transact in real estate rests entirely with you.
          </p>
          <p>
            We encourage you to independently verify any information that is
            material to your decision, including by visiting project sites,
            reviewing original regulatory filings, and consulting with
            qualified professionals.
          </p>
        </div>
      </section>

      {/* Limitation of Liability */}
      <section id="liability" className={S.section}>
        <h2 className={S.h2}>Limitation of Liability</h2>
        <div className={S.body}>
          <p>
            To the fullest extent permitted by applicable law, Truth Estate,
            its founders, employees, and contractors shall not be liable for
            any direct, indirect, incidental, consequential, or punitive
            damages arising from:
          </p>
          <ul className={S.ul}>
            <Bullet>Your use of or reliance on information published by Truth Estate</Bullet>
            <Bullet>Any property purchase, investment, or financial decision made based on our research</Bullet>
            <Bullet>Errors, omissions, or inaccuracies in our content</Bullet>
            <Bullet>Interruptions in access to our platform or services</Bullet>
          </ul>
          <p>
            This limitation applies regardless of whether the claim is based
            in contract, tort, negligence, strict liability, or any other legal
            theory.
          </p>
        </div>
        <Todo>
          Legal review required: confirm limitation of liability clauses comply
          with Indian Consumer Protection Act 2019 and Information Technology
          Act 2000.
        </Todo>
      </section>

      <div className={S.divider} />

      {/* Changes */}
      <section id="changes" className={S.section}>
        <h2 className={S.h2}>Changes to This Disclaimer</h2>
        <div className={S.body}>
          <p>
            We may update this disclaimer from time to time to reflect changes
            in our services, legal requirements, or business practices. When we
            make material changes, we will update the &ldquo;Last
            updated&rdquo; date at the top of this page.
          </p>
          <p>
            Your continued use of Truth Estate after changes are published
            constitutes acceptance of the revised disclaimer.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className={S.section}>
        <h2 className={S.h2}>Contact</h2>
        <div className={S.body}>
          <p>
            If you have questions about this disclaimer or our research
            methodology, we welcome your enquiry at{" "}
            <a href="mailto:legal@truthestate.in" className={S.link}>
              legal@truthestate.in
            </a>
          </p>
        </div>
        <Todo>
          Add registered business address and any applicable registration
          numbers once company incorporation is finalised.
        </Todo>
      </section>
    </LegalLayout>
  );
}
