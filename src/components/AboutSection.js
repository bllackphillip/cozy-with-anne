import Image from "next/image";
import Link from "next/link";

const PARA_1 =
  "Ever since I can remember, I had a pencil or a brush in my hand. Everything that I would find interesting, I would sketch. Slowly, I got into trying different mediums, but there was always something that took me back to oils. The bold texture, the vibrancy, the way you can combine and control the brushstrokes gave me a sense of freedom that was only between me and the canvas. Capturing the hidden beauty in every day things is something that my artworks are inclined to. A simple avocado, a coffee cup, an old telephone - things that we walk past without a second thought. My paintings reflect the life that I can give to those subjects through bright colors, thick and almost sculptural brushwork - giving weight, presence and ultimately life, to the things we have learned to overlook.";

const HOMEPAGE_QUOTE =
  "Capturing the hidden beauty in every day things is something that my artworks are inclined to. A simple avocado, a coffee cup, an old telephone - things that we walk past without a second thought. My paintings reflect the life that I can give to those subjects through bright colors, thick and almost sculptural brushwork - giving weight, presence and ultimately life, to the things we have learned to overlook.";

const STORY_PARAS = [
  "My dad was the one who initially rooted this passion in me as he had this natural talent of sketching so realistically. I found that fascinating from a very young age and I tried to replicate that. He would paint my bedroom walls with Disney princesses (or later, Eminem), make portraits of me, or even correct my own sketches.",
  "Because of the old cliché, that you cannot make a living out of art, I didn't pursue this domain. I only treated it as a hobby, and more and more as a way to escape. I have always been a very self-conscious, self-reflecting and very introvert person, so spending many hours in a flow state sketching or painting, was something that always helped me quiet the noise and come back to myself. To find a stillness that I couldn't quite reach anywhere else.",
  "On my 16th birthday, my dad flew me to the Van Gogh Museum as it was one of my dreams to see the famous paintings up close, not only from a screen. Maybe my main source of inspiration, the Van Gogh brushwork. After that trip, I chose to move aboard from Romania to the Netherlands in order to study Tourism Management at a prestigious university in Amsterdam. Being a fresh 18 years old teenager moved in a completely different country, no friends or family (besides my dad who lived a few hours away), I had to put my art aside for a while. I still sketched and painted from time to time, but my priority was my higher education. But I still managed to find a way or another back to art. In between classes (or sometimes even during), I would take out my art books and read. Color theory, art movements, famous painters and their works, and all kinds of research so that I could extend my knowledge even further.",
  "During the pandemic was the time when I got back to painting and experimenting, developing my own style. I had to move 5 times in less than 6 months in 3 different cities across the NL. I would paint even 3 canvases per day, ending up intoxicated from the oils twice. Ultimately, after overcoming and healing from my not so happy experiences, I finally started painting out of happiness instead of misery. I found a strong sense of creating and I haven't let go of that to this day, and probably never will.",
  "After graduation, I got into a corporate job which I am still working at to this day. It gets quite intense most of the times, but that is exactly the reason I would not stop painting. Art keeps me focused, grounded, and balanced. It is my best way of not losing myself in a fast paced world, where there are superficial values and beliefs that I don't agree with. It is my quiet act of resistance, a reminder of who in a world that is constantly trying to tell you who to be.",
  "That same care goes into every order I send out: each piece is packed by hand in recycled, plastic-free materials, because the way something reaches you is part of the work too.",
];

function AboutHeading() {
  return (
    <h1
      className="text-3xl sm:text-4xl text-[var(--color-accent)] text-center"
      style={{ fontFamily: "var(--font-fraunces)" }}
    >
      About me
    </h1>
  );
}

function SidebarImage({ url, alt }) {
  if (!url) return null;
  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg art-frame">
      <Image src={url} alt={alt} fill className="object-cover" />
    </div>
  );
}

function InlineImage({ url, alt }) {
  if (!url) return null;
  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg my-6 art-frame">
      <Image src={url} alt={alt} fill className="object-cover" />
    </div>
  );
}

export default function AboutSection({ images, compact = false }) {
  const img1 = images?.[0]?.url;
  const img2 = images?.[1]?.url;
  const img3 = images?.[2]?.url;
  const img4 = images?.[3]?.url;
  const img5 = images?.[4]?.url;
  const img6 = images?.[5]?.url;

  return (
    <section>
      {/* "About me" heading above the photo */}
      <div className="pt-10 pb-4 px-6">
        <AboutHeading />
      </div>

      {/* Top banner — full width on mobile, framed on desktop */}
      {img1 && (
        <div className="flex justify-center bg-[var(--color-bg)] py-4 sm:py-8">
          <Image
            src={img1}
            alt="Anne in her studio"
            width={2400}
            height={1000}
            className="w-full h-auto sm:w-auto sm:h-[52vh] rounded-none sm:rounded-2xl shadow-lg art-frame"
            priority
          />
        </div>
      )}

      {compact ? (
        <div className="max-w-3xl mx-auto px-6 pt-8 pb-14 text-center">
          <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
            {HOMEPAGE_QUOTE}
          </p>
          <Link
            href="/about"
            className="mt-8 inline-block px-8 py-3 text-sm font-medium site-btn-active"
          >
            Read more about me
          </Link>
        </div>
      ) : (
        <>
          <div className="px-6 sm:px-10 lg:px-16 py-12 sm:py-20">
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">

              {/* Left sidebar — img4 + img5, sticky, desktop only */}
              <div className="hidden md:flex flex-col gap-6 w-80 lg:w-96 flex-shrink-0 sticky top-24 self-start">
                <SidebarImage url={img4} alt="Anne's studio" />
                <SidebarImage url={img5} alt="Anne's studio" />
              </div>

              {/* Text column — with inline images on mobile, plain paragraphs on desktop */}
              <div className="flex-1 min-w-0 text-gray-700 leading-relaxed text-base sm:text-lg text-center">
                <p>{PARA_1}</p>

                {/* 3.jpg — after PARA_1, mobile only */}
                <div className="md:hidden">
                  <InlineImage url={img3} alt="Anne's studio" />
                </div>

                <p className="mt-6">{STORY_PARAS[0]}</p>
                <p className="mt-6">{STORY_PARAS[1]}</p>

                {/* 2.jpg — after "...anywhere else.", mobile only */}
                <div className="md:hidden">
                  <InlineImage url={img2} alt="Anne's studio" />
                </div>

                <p className="mt-6">{STORY_PARAS[2]}</p>

                {/* 4.jpg — after "...knowledge even further.", mobile only */}
                <div className="md:hidden">
                  <InlineImage url={img4} alt="Anne's studio" />
                </div>

                <p className="mt-6">{STORY_PARAS[3]}</p>

                {/* 5.jpg — after pandemic paragraph, mobile only */}
                <div className="md:hidden">
                  <InlineImage url={img5} alt="Anne's studio" />
                </div>

                <p className="mt-6">{STORY_PARAS[4]}</p>
              </div>

              {/* Right sidebar — img3 + img2, sticky, desktop only */}
              <div className="hidden md:flex flex-col gap-6 w-80 lg:w-96 flex-shrink-0 sticky top-24 self-start">
                <SidebarImage url={img3} alt="Anne's studio" />
                <SidebarImage url={img2} alt="Anne's studio" />
              </div>

            </div>
          </div>

          {/* Closing banner */}
          {img6 && (
            <div className="flex justify-center bg-[var(--color-bg)] py-4 sm:py-8">
              <Image
                src={img6}
                alt="Anne's studio"
                width={2400}
                height={1000}
                className="w-full h-auto sm:w-auto sm:h-[52vh] rounded-none sm:rounded-2xl shadow-lg art-frame"
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
