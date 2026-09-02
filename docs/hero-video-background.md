# Hero background footage — not wired up yet

The component exists at `src/components/home/hero-video-background.tsx` but
nothing renders it: the hero was left on its static gradient until real
footage is available. To switch it on, add to `src/components/home/hero.tsx`:

```tsx
import {
  HeroVideoBackground,
  type HeroVideoSource,
} from "@/components/home/hero-video-background";

const HERO_VIDEOS: readonly HeroVideoSource[] = [
  { src: "/videos/hero/manufacturing-1.mp4", poster: "/videos/hero/manufacturing-1.jpg" },
  { src: "/videos/hero/manufacturing-2.mp4", poster: "/videos/hero/manufacturing-2.jpg" },
];
```

then render `<HeroVideoBackground sources={HERO_VIDEOS} onActiveChange={setVideoActive} />`
inside the hero's background layer, behind a readability veil that flips with
the theme — the copy is navy-on-light in the light theme and white-on-navy in
dark, so plain footage underneath it will not read either way. Two more things
have to key off that `videoActive` flag: dim the decorative SVG line work, and
drop `mix-blend-multiply` from the product cut-outs (multiply over moving
footage smears the product into the frame behind it).

The rest of this file is the sourcing and encoding guide, unchanged.

---

The homepage hero plays the clips listed in `HERO_VIDEOS` in
`src/components/home/hero.tsx` back-to-back, on a loop, with a one-second
cross-fade between them. Drop the files here with these exact names:

    manufacturing-1.mp4      <- first clip
    manufacturing-1.jpg      <- optional first frame (poster)
    manufacturing-2.mp4      <- second clip
    manufacturing-2.jpg      <- optional first frame (poster)

Want more than two, or different names? Edit the `HERO_VIDEOS` array in
`src/components/home/hero.tsx` — the rotation follows the list. Until the
files exist the hero just shows its static gradient, so nothing breaks while
you are still sourcing footage.

## How to encode

Web hero footage has to be small; visitors download it before they can read
anything. Target **under ~4 MB per clip**.

- Format: **MP4 / H.264 + `yuv420p`** (the one format every browser plays).
- Resolution: **1280x720** is plenty behind a veil. 1080p only if the clip is
  short.
- Length: **8–15 seconds**, ideally starting and ending on a similar frame.
- **No audio track** — it is muted anyway, and the track is dead weight.
- No captions, logos or watermarks burned in.

With ffmpeg:

    ffmpeg -i source.mov -an -vf "scale=1280:-2" -c:v libx264 -profile:v main \
      -pix_fmt yuv420p -crf 26 -preset slow -movflags +faststart \
      manufacturing-1.mp4

    # first frame, for the poster
    ffmpeg -i manufacturing-1.mp4 -vframes 1 -q:v 4 manufacturing-1.jpg

`-movflags +faststart` matters: without it the browser cannot start playing
until the whole file has arrived.

## Where to get clips

Best is our own floor — a phone on a tripod at the moulding machines, the
extruder, or the packing line, held steady for 15 seconds, gives footage no
stock library can match and with no licensing question at all.

Otherwise use a library that grants commercial use in writing, and keep the
licence page with the invoice records:

- Pexels Videos — pexels.com/videos (free, commercial use allowed)
- Pixabay — pixabay.com/videos (free, commercial use allowed)
- Coverr — coverr.co (free, commercial use allowed)
- Envato / Artgrid / Storyblocks (paid, if a specific look is needed)

Search terms that land on the right material: *plastic injection moulding*,
*factory production line*, *industrial manufacturing*, *conveyor belt factory*.

Do **not** pull clips off a Google image/video search or a YouTube downloader.
Those are almost always someone else's copyrighted footage, and a company
homepage is exactly the kind of commercial use that gets noticed.

## A note on the repo

These files are large and binary. If they start bloating clone times, move
them to the CDN / object storage the images use and point `HERO_VIDEOS` at the
full URLs instead — the component takes any `src` a `<video>` accepts.
