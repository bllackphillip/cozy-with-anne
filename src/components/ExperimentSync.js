"use client";
import { useEffect } from "react";
import { syncExperimentsFromUrl } from "@/lib/useExperiment";

/*
  Mounted once in the root layout so an experiment URL param
  (?expA=… / ?expB=… / ?expD=…) is captured into localStorage on ANY page. This
  persists the researcher's chosen variant across navigation and the Stripe
  redirect, so a choice made before checkout is still active on the confirmation
  page. Renders nothing.
*/
export default function ExperimentSync() {
  useEffect(() => {
    syncExperimentsFromUrl();
  }, []);
  return null;
}
