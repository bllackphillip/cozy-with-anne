import PolicyPage from "@/components/PolicyPage";

export const metadata = {
  title: "Privacy Policy | Cozy with Anne",
  description: "How we collect, use, and disclose your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage title="Privacy Policy" lastUpdated="17 June 2026">
      <p>
        This Privacy Policy describes how Cozy with Anne (the &quot;Site&quot; or &quot;we&quot;)
        collects, uses, and discloses your Personal Information when you visit or make a purchase from
        the Site.
      </p>

      <h2>Collecting Personal Information</h2>
      <p>
        When you visit the Site, we collect certain information about your device, your interaction with
        the Site, and information necessary to process your purchases. We may also collect additional
        information if you contact us for customer support. We refer to any information that can uniquely
        identify an individual as &quot;Personal Information&quot;.
      </p>

      <h3>Device information</h3>
      <ul>
        <li>
          <strong>Examples collected:</strong> version of web browser, IP address, time zone, cookie
          information, what pages or products you view, search terms, and how you interact with the Site.
        </li>
        <li>
          <strong>Purpose:</strong> to load the Site accurately for you, and to perform analytics on
          Site usage to optimise our Site.
        </li>
        <li>
          <strong>Source:</strong> collected automatically when you access our Site using cookies, log
          files, web beacons, tags, or pixels.
        </li>
      </ul>

      <h3>Order information</h3>
      <ul>
        <li>
          <strong>Examples collected:</strong> name, billing address, shipping address, payment
          information, email address, and phone number.
        </li>
        <li>
          <strong>Purpose:</strong> to provide products or services to you (fulfil our contract),
          process payment, arrange shipping, provide invoices and order confirmations, communicate with
          you, and screen orders for potential risk or fraud.
        </li>
        <li>
          <strong>Source:</strong> collected from you.
        </li>
      </ul>

      <h2>Minors</h2>
      <p>
        The Site is not intended for individuals under the age of 18. We do not intentionally collect
        Personal Information from children. If you are a parent or guardian and believe your child has
        provided us with Personal Information, please contact us to request deletion.
      </p>

      <h2>Sharing Personal Information</h2>
      <p>
        We share your Personal Information with service providers who help us provide our services and
        fulfil our contracts with you (for example, our payment processor and hosting provider). We may
        also share your Personal Information to comply with applicable laws and regulations, to respond
        to a lawful request, or to otherwise protect our rights.
      </p>
      <p>
        We work with a small number of service providers who process Personal Information on our
        behalf, only as needed to run the Site:
      </p>
      <ul>
        <li>
          <strong>Stripe</strong> - payment processing. Your card details are entered on Stripe&apos;s
          own secure checkout and never pass through or get stored on our servers.
        </li>
        <li>
          <strong>Google Firebase</strong> (Firestore &amp; Cloud Storage) - stores order records and
          hosts artwork images.
        </li>
        <li>
          <strong>Vercel</strong> - website hosting and content delivery.
        </li>
      </ul>
      <p>
        Each of these providers is bound by its own privacy and data-processing terms and may only use
        your information to provide their service to us.
      </p>

      <h2>Using Personal Information</h2>
      <p>
        We use your Personal Information to provide our services to you, which includes offering products
        for sale, processing payments, shipping and fulfilment of your order, and keeping you up to date
        on new products, services, and offers.
      </p>

      <h2>Selling Personal Information</h2>
      <p>Our Site does not sell any Personal Information.</p>

      <h2>Cookies</h2>
      <p>
        A cookie is a small amount of information that&apos;s downloaded to your computer or device when
        you visit our Site. Cookies make your browsing experience better by allowing the website to
        remember your actions and preferences, and they provide information on how people use the
        website. You can modify your browser settings to block, manage, or filter cookies; more
        information can be found in your browser&apos;s help file or at www.allaboutcookies.org.
      </p>

      <h2>Contact</h2>
      <p>
        For more information about our privacy practices, if you have questions, or if you would like to
        make a complaint, please email us at{" "}
        <a href="mailto:support@cozywithanne.com">support@cozywithanne.com</a>.
      </p>
    </PolicyPage>
  );
}
