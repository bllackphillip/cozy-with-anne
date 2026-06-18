"use client";
import { useExperiment } from "@/lib/useExperiment";

/*
  Experiment A — post-purchase confirmation copy (§4.6, Blind Spot #2).
  Default "warm" = the artist-voice thank-you; "generic" = a plain receipt, for
  the within-session comparison. The variant is read from localStorage/URL so it
  survives the Stripe redirect onto this page.
*/
export default function ConfirmationMessage({ firstName, email }) {
  const variant = useExperiment("A", "warm");

  const emailLine = email ? (
    <>
      {" "}A confirmation has been sent to{" "}
      <span className="text-gray-800">{email}</span>.
    </>
  ) : (
    <> You&apos;ll receive a confirmation email shortly.</>
  );

  if (variant === "generic") {
    return (
      <>
        <div className="text-5xl mb-6">🧾</div>
        <h1
          className="text-3xl sm:text-4xl text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Order confirmed
        </h1>
        <p className="mt-6 text-gray-600 leading-relaxed">
          Your order has been received and is being processed.{emailLine}
        </p>
      </>
    );
  }

  return (
    <>
      <div className="text-5xl mb-6">🎨</div>
      <h1
        className="text-3xl sm:text-4xl text-[var(--color-accent)]"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        Thank you{firstName ? `, ${firstName}` : ""} for your order!
      </h1>
      <p className="mt-6 text-gray-600 leading-relaxed">
        Anne will pack your order with care and recycled materials, and send it
        your way soon.{emailLine}
      </p>
    </>
  );
}
