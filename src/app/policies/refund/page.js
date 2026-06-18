import PolicyPage from "@/components/PolicyPage";

export const metadata = {
  title: "Refund Policy | Cozy with Anne",
  description: "Payments, returns, and how damages and issues are handled.",
};

export default function RefundPolicyPage() {
  return (
    <PolicyPage title="Refund Policy">
      <h2>Payments</h2>
      <p>
        Payments for commissions are made upfront. Installment options may be available. We stay in
        contact throughout to ensure your satisfaction.
      </p>
      <p>For regular orders, payment occurs at purchase.</p>

      <h2>Returns &amp; your right to cancel</h2>
      <p>
        If you are buying as a consumer in the EU, you have the right to cancel your order within{" "}
        <strong>14 days</strong> of receiving it, without giving a reason. This applies to our
        ready-made items: prints, stickers, and any original painting that was already finished and
        in stock.
      </p>
      <p>
        To cancel, just email us at{" "}
        <a href="mailto:support@cozywithanne.com">support@cozywithanne.com</a> within those 14 days.
        You then have a further 14 days to send the item back. It must be returned unused and in its
        original condition; return postage is the customer&apos;s responsibility unless the item
        arrived damaged or faulty. Once we receive it, we refund the full price (including the
        original standard shipping cost) within 14 days, using your original payment method.
      </p>
      <p>
        <strong>Commissions and other personalised, made-to-order pieces are exempt</strong> from
        this 14-day right, because they are created specifically for you and cannot be resold. We
        stay in close contact throughout a commission so you are happy with it before it ships, and
        if anything is ever wrong we will always try to put it right.
      </p>

      <h2>Damages and Issues</h2>

      <h3>Oil Paintings and Commissions</h3>
      <p>
        Your package is fully insured during shipment via signature-required delivery. If damage occurs:
      </p>
      <ol>
        <li>Sign the package noting the damage and photograph it upon receipt to establish responsibility.</li>
        <li>Contact us within 48 hours of delivery.</li>
        <li>Retain all packaging materials until the claim is resolved.</li>
        <li>We file the insurance claim and provide a replacement or full refund.</li>
      </ol>

      <h3>Prints</h3>
      <p>
        If the prints are damaged in the mail, we will send you new prints at no extra cost. Proof of
        damage from the recipient initiates the process.
      </p>

      <p>
        If you have any questions about a refund or a damaged order, please email us at{" "}
        <a href="mailto:support@cozywithanne.com">support@cozywithanne.com</a>.
      </p>
    </PolicyPage>
  );
}
