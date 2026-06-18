export function getCheckoutShippingDetails(session) {
  const collectedShipping =
    session?.collected_information?.shipping_details ??
    session?.shipping_details ??
    null;

  return {
    name: collectedShipping?.name ?? session?.customer_details?.name ?? null,
    address:
      collectedShipping?.address ?? session?.customer_details?.address ?? null,
  };
}
