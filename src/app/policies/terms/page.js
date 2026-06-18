import PolicyPage from "@/components/PolicyPage";

export const metadata = {
  title: "Terms of Service | Cozy with Anne",
  description: "The terms governing use of this site and purchases.",
};

export default function TermsOfServicePage() {
  return (
    <PolicyPage title="Terms of Service">
      <p>
        These Terms of Service govern your use of this website and any purchases you make. By accessing
        the site or placing an order, you agree to the terms below.
      </p>

      <h2>Overview</h2>
      <p>
        This site is operated by Cozy with Anne. Users must be of legal age and agree to all terms before
        using the site. We reserve the right to refuse service and to modify these terms; changes take
        effect when posted here.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the site for any unlawful purpose;</li>
        <li>transmit malicious code or attempt to compromise the site&apos;s security;</li>
        <li>reproduce, copy, or exploit any artwork or site content without permission;</li>
        <li>engage in harassment, spam, or unauthorised data collection.</li>
      </ul>

      <h2>Products &amp; pricing</h2>
      <ul>
        <li>Prices and product availability may change without notice.</li>
        <li>Products are limited and subject to our shipping and refund policies.</li>
        <li>
          We cannot guarantee that colours shown on your screen are perfectly accurate; every monitor
          displays colour differently, and original paintings vary by nature.
        </li>
      </ul>

      <h2>Limitation of liability</h2>
      <p>
        The service is provided &quot;as is&quot; without warranties of any kind. To the extent permitted
        by law, we are not liable for damages arising from your use of the site, nor for the content of
        any third-party links or tools.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the Netherlands, where the seller is based, and any
        disputes will be subject to the competent Dutch courts. If you are a consumer resident
        elsewhere in the EU, you also keep the benefit of any mandatory consumer-protection rules of
        your own country of residence.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms of Service should be sent to us at{" "}
        <a href="mailto:support@cozywithanne.com">support@cozywithanne.com</a>.
      </p>
    </PolicyPage>
  );
}
