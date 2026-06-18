import PolicyPage from "@/components/PolicyPage";

export const metadata = {
  title: "Shipping Policy | Cozy with Anne",
  description: "How orders are processed and shipped.",
};

export default function ShippingPolicyPage() {
  return (
    <PolicyPage title="Shipping Policy">
      <p>
        <strong>Processing times are separate from the shipping times you see at checkout.</strong>
      </p>
      <p>
        All orders (except commissions) are processed within 1 to 7 business days after receiving your
        order confirmation email. You will receive another notification when your order has shipped.
      </p>
      <p>
        If you&apos;re ordering a recently painted original painting, it might be wet and, therefore, it
        might take a week longer to ship. If you want to plan your estimated delivery time, let me know
        and I will gladly help you with that.
      </p>
      <p>
        <strong>Orders containing original paintings and commissions</strong> are shipped with Priority
        Shipping from <strong>FedEx</strong> with door to door service, tracking number, fully insured
        and <strong>signature required.</strong> Please be sure you check their emails to track the
        package, as they need someone at home to sign upon reception. You can schedule the delivery time
        or pick up point in most countries.
      </p>
      <p>
        <strong>Orders just containing prints</strong> will be shipped with Priority Shipping from{" "}
        <strong>FedEx</strong> with door to door service, tracking number, fully insured and{" "}
        <strong>signature required.</strong>
      </p>

      <h2>Shipping times for Priority Shipping with FedEx</h2>
      <p>(Any order containing at least one original painting or commission.)</p>
      <table>
        <thead>
          <tr>
            <th>Zone</th>
            <th>Shipping Time</th>
            <th>Cost (light, medium and heavy packages)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>USA, Canada, UK</td>
            <td>2–5 business days</td>
            <td>15–45€</td>
          </tr>
          <tr>
            <td>EU</td>
            <td>2–7 business days</td>
            <td>10–45€</td>
          </tr>
          <tr>
            <td>Rest of World</td>
            <td>5–15 business days</td>
            <td>20–50€</td>
          </tr>
        </tbody>
      </table>

      <h2>International Shipping: import fees</h2>
      <p>
        Your order may be subject to import duties and taxes, which are incurred once a shipment reaches
        your destination country. We are not responsible for these charges if they are applied; they are
        the responsibility of the customer.
      </p>

      <h2>Wrong address or returned</h2>
      <p>
        We are not responsible if the address is wrong or missing information, or if there wasn&apos;t
        anyone at home and the order is returned. In this case, the customer should pay for the shipping
        to get it shipped again.
      </p>

      <h2>How do I check the status of my order?</h2>
      <p>
        When your order has shipped, you will receive an email notification which will include a tracking
        number you can use to check its status. Please allow 24–48 hours for the tracking information to
        become available.
      </p>
      <p>
        If the order doesn&apos;t arrive within the shipping times in this table, email us at{" "}
        <a href="mailto:support@cozywithanne.com">support@cozywithanne.com</a> so we can track and fix
        that. If you have any doubt about the tracking status, please get in touch with your name and
        order number, and we will look into it for you.
      </p>
    </PolicyPage>
  );
}
