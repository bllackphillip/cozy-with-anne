import { getImagesFromFolder } from "@/lib/storage";
import AboutSection from "@/components/AboutSection";

export const metadata = {
  title: "About | Cozy with Anne",
  description: "Anne's story - how oil painting became her quiet act of resistance.",
};

export default async function AboutPage() {
  const images = await getImagesFromFolder("site/about");
  return (
    <div className="page-enter">
      <AboutSection images={images} />
    </div>
  );
}
