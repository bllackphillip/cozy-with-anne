import PolicyPage from "@/components/PolicyPage";

export const metadata = {
  title: "Privacy Policy | Cozy with Anne",
  description: "What personal information we collect, why, and who we share it with.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage title="Privacy Policy" lastUpdated="18 June 2026">
      <p>
        This Privacy Policy describes how Cozy with Anne (the &quot;Site&quot;, &quot;we&quot;, or
        &quot;I&quot;) collects, uses, and shares your personal information when you visit the Site,
        place an order, send a commission enquiry, or sign up to the newsletter. We only collect what we
        genuinely need, and we keep it honest: this policy describes what the Site actually does, not a
        generic template.
      </p>

      <h2>What we collect, and why</h2>

      <h3>Order information</h3>
      <ul>
        <li>
          <strong>Collected:</strong> your name, email address, and shipping/billing address.
        </li>
        <li>
          <strong>Why:</strong> to take payment, fulfil and ship your order, send you order and shipping
          confirmations, and reply if you contact us about it.
        </li>
        <li>
          <strong>Card details:</strong> your card number is entered on Stripe&apos;s own secure checkout
          and is processed by Stripe. It never passes through or is stored on our servers.
        </li>
      </ul>

      <h3>Commission enquiries</h3>
      <ul>
        <li>
          <strong>Collected:</strong> your name, email address, your message, and any reference image you
          choose to attach.
        </li>
        <li>
          <strong>Why:</strong> so we can reply to your enquiry and discuss your commission. Enquiries are
          stored in our database (Google Firebase) until they are dealt with; attachments are stored
          privately and are visible only to the artist.
        </li>
      </ul>

      <h3>Newsletter</h3>
      <ul>
        <li>
          <strong>Collected:</strong> your email address.
        </li>
        <li>
          <strong>Why:</strong> to let you know about new work and shop openings, only if you ask us to.
          Your email is stored in our database until you unsubscribe. To unsubscribe at any time, email{" "}
          <a href="mailto:support@cozywithanne.com">support@cozywithanne.com</a> and we will remove you.
        </li>
      </ul>

      <h2>What we do not do</h2>
      <p>
        We do not use analytics, advertising, or third-party tracking pixels, web beacons, or tags, and
        we do not build a profile of your browsing. We do not ask for or store your phone number, and we
        never sell your personal information.
      </p>

      <h2>Cookies and local storage</h2>
      <p>
        We do not set tracking or advertising cookies. To make the Site work, your browser&apos;s local
        storage keeps two things on your own device: the contents of your shopping cart, and the colour
        theme you choose. This information stays in your browser and is not sent to us or shared. When you
        pay, Stripe&apos;s secure checkout (on Stripe&apos;s own domain) may set its own cookies for fraud
        prevention and to process the payment; that is governed by Stripe&apos;s privacy policy.
      </p>

      <h2>Who we share information with</h2>
      <p>
        We work with a small number of service providers who process personal information on our behalf,
        only as needed to run the Site. Each is bound by its own privacy and data-processing terms and may
        only use your information to provide its service to us:
      </p>
      <ul>
        <li>
          <strong>Stripe</strong> - payment processing and secure checkout.
        </li>
        <li>
          <strong>Google Firebase</strong> (Firestore &amp; Cloud Storage) - stores order records,
          commission enquiries, newsletter sign-ups, reference-image attachments, and hosts artwork
          images.
        </li>
        <li>
          <strong>Resend</strong> - sends transactional emails (order confirmations and enquiry-related
          messages).
        </li>
        <li>
          <strong>Vercel</strong> - website hosting and content delivery.
        </li>
      </ul>
      <p>
        We may also disclose your information where required to comply with applicable laws, to respond to
        a lawful request, or to protect our rights.
      </p>

      <h2>Your rights</h2>
      <p>
        If you are in the EU/EEA or the UK, you have the right to access, correct, or delete the personal
        information we hold about you, to object to or restrict certain processing, and to receive a copy
        of your data. To exercise any of these rights, email us at{" "}
        <a href="mailto:support@cozywithanne.com">support@cozywithanne.com</a> and we will respond as soon
        as we can.
      </p>

      <h2>Minors</h2>
      <p>
        The Site is not intended for individuals under the age of 18, and we do not intentionally collect
        personal information from children. If you believe a child has provided us with personal
        information, please contact us to request deletion.
      </p>

      <h2>Contact</h2>
      <p>
        For any questions about this policy or your information, or to make a request or complaint, please
        email us at{" "}
        <a href="mailto:support@cozywithanne.com">support@cozywithanne.com</a>.
      </p>
    </PolicyPage>
  );
}
