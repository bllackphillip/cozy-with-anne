"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const LOGO_MAP = {
  atelier: "/herologo.png",
  evening: "/herologo-evening.png",
  garden:  "/herologo-garden.png",
  beeswax: "/herologo-beeswax.png",
};

export default function HeroLogo() {
  const [src, setSrc] = useState("/herologo.png");

  useEffect(() => {
    function update() {
      const theme = document.documentElement.getAttribute("data-theme") || "atelier";
      setSrc(LOGO_MAP[theme] ?? "/herologo.png");
    }
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <Image
      src={src}
      alt="Cozy with Anne"
      width={1100}
      height={300}
      className="max-h-44 sm:max-h-[230px] md:max-h-[269px] w-auto mx-auto"
    />
  );
}
