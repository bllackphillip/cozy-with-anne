"use client";
import { useExperiment } from "@/lib/useExperiment";

/*
  Experiment B — commission reassurance (§4.6). Default "on" shows the
  progress-photo promise; "off" removes it, for the within-session comparison on
  the highest-risk purchase.
*/
export default function ProgressPhotoLine() {
  const variant = useExperiment("B", "on");
  if (variant === "off") return null;
  return (
    <>
      {" "}
      I&apos;ll share progress photos as it develops, so you can watch it come to
      life.
    </>
  );
}
