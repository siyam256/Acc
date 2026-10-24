import React from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  Sequence,
  interpolate,
  registerRoot,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadHind } from "@remotion/google-fonts/HindSiliguri";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */
const hind = loadHind("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
}).fontFamily;
const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
}).fontFamily;
// Latin -> Inter, Bengali -> Hind Siliguri (automatic glyph fallback)
const FONT = `${inter}, ${hind}, sans-serif`;

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */
const FPS = 30;
const W = 1080;
const H = 1920;
const VIDEO_SECONDS = 281; // voiceover ends ~279.8s
const DURATION = VIDEO_SECONDS * FPS;
const f = (s: number) => Math.round(s * FPS);

// public/ folder এ এই নামে ফাইলটা রাখুন
const AUDIO_FILE = "voiceover.mp3"; // workflow নিজে ElevenLabs*.mp3 কে এই নামে বদলে নেয়

const C = { bg: "#ffffff", ink: "#0a0a0a", mute: "#6b6b6b" };

// Phone geometry
const SHOT_W = 1080;
const SHOT_H = 2340;
const BEZEL = 14;
const PHONE_TOP = 350;
const SCREEN_H = H - PHONE_TOP - 40 - BEZEL * 2;
const SCREEN_W = Math.round((SCREEN_H * SHOT_W) / SHOT_H);
const K = SCREEN_W / SHOT_W; // screenshot px -> screen px
const PHONE_W = SCREEN_W + BEZEL * 2;
const PHONE_H = SCREEN_H + BEZEL * 2;
const PHONE_LEFT = Math.round((W - PHONE_W) / 2);

const SHOT_FADE = 0.4;
const OUTRO_START = 268.6;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ------------------------------------------------------------------ */
/* Screenshot files (all inside public/)                               */
/* ------------------------------------------------------------------ */
const F = {
  light: "Screenshot_20261024_170052_Admission Calendar.jpg",
  dark: "Screenshot_20261024_170059_Admission Calendar.jpg",
  info: "Screenshot_20261024_170230_Admission Calendar.jpg",
  apply: "Screenshot_20261024_170235_Admission Calendar.jpg",
  admit: "Screenshot_20261024_170240_Admission Calendar.jpg",
  result: "Screenshot_20261024_170244_Admission Calendar.jpg",
  dlEmpty: "Screenshot_20261024_170155_Admission Calendar.jpg",
  dlBio: "Screenshot_20261024_170211_Admission Calendar.jpg",
  myCal: "Screenshot_20261024_170220_Admission Calendar.jpg",
  study: "Screenshot_20261024_170255_Admission Calendar.jpg",
  apiKey: "Screenshot_20261024_170311_Admission Calendar.jpg",
  chat: "Screenshot_20261024_170318_Admission Calendar.jpg",
  more: "Screenshot_20261024_170301_Admission Calendar.jpg",
  web: "Screenshot_20261024_170342_Chrome.jpg",
  pdf: "Screenshot_20261024_170352_Chrome.jpg",
  offline: "Screenshot_20261024_170450_Admission Calendar.jpg",
  homeMenu: "Screenshot_20261024_170403_One UI Home.jpg",
  widgetPick: "Screenshot_20261024_170409_One UI Home.jpg",
  homeWidgets: "Screenshot_20261024_170436_One UI Home.jpg",
};

/* ------------------------------------------------------------------ */
/* Timeline data (seconds, taken from the SRT)                         */
/* ------------------------------------------------------------------ */
type Shot = { file: string; from: number };
type Tap = { at: number; x: number; y: number };
type Hl = {
  x: number;
  y: number;
  w: number;
  h: number;
  from: number;
  to: number;
  tap?: Tap;
};
type Scene = { start: number; end: number; title: string; sub: string };

const SHOTS: Shot[] = [
  { file: F.light, from: 0 },
  { file: F.dark, from: 25.0 },
  { file: F.light, from: 32.9 },
  { file: F.info, from: 81.8 },
  { file: F.apply, from: 91.2 },
  { file: F.admit, from: 107.8 },
  { file: F.result, from: 113.4 },
  { file: F.dlEmpty, from: 122.6 },
  { file: F.dlBio, from: 136.3 },
  { file: F.myCal, from: 142.6 },
  { file: F.study, from: 165.2 },
  { file: F.chat, from: 185.4 },
  { file: F.apiKey, from: 197.4 },
  { file: F.more, from: 207.2 },
  { file: F.web, from: 229.1 },
  { file: F.pdf, from: 234.3 },
  { file: F.offline, from: 243.4 },
  { file: F.homeMenu, from: 254.8 },
  { file: F.widgetPick, from: 259.0 },
  { file: F.homeWidgets, from: 262.0 },
];

// hl(x, y, w, h, from, to, tap?)  -> coordinates are in screenshot pixels (1080x2340)
const hl = (
  x: number,
  y: number,
  w: number,
  h: number,
  from: number,
  to: number,
  tap?: Tap,
): Hl => ({ x, y, w, h, from, to, tap });

const HIGHLIGHTS: Hl[] = [
  // 01 light / dark
  hl(270, 118, 540, 84, 14.0, 18.0),
  hl(905, 118, 142, 76, 18.2, 32.8),
  // 02 update box
  hl(35, 293, 1010, 245, 33.0, 35.2),
  hl(252, 438, 297, 75, 35.2, 36.8),
  hl(570, 438, 258, 75, 36.8, 38.4),
  hl(35, 293, 1010, 245, 38.4, 46.2),
  // 03 breaking news
  hl(35, 565, 1010, 90, 46.6, 58.0),
  // 04 search
  hl(35, 682, 1010, 99, 58.2, 65.0),
  // 05 timetable
  hl(40, 812, 1005, 105, 65.2, 67.4),
  hl(45, 820, 194, 86, 67.4, 69.6),
  hl(35, 945, 325, 1170, 69.6, 71.0),
  hl(361, 945, 337, 1170, 71.0, 74.6),
  hl(698, 945, 347, 1170, 74.6, 81.6),
  // 06 info tab
  hl(62, 955, 120, 1140, 83.4, 85.8),
  hl(35, 945, 1010, 1175, 85.8, 88.4),
  hl(35, 945, 1010, 158, 88.4, 91.1, { at: 89.3, x: 540, y: 1023 }),
  // 07 apply tab
  hl(445, 820, 193, 86, 91.2, 93.5),
  hl(243, 1077, 285, 725, 93.5, 99.3),
  hl(528, 1077, 338, 725, 99.3, 103.3),
  hl(866, 1077, 179, 725, 103.3, 107.6, { at: 105.3, x: 955, y: 1167 }),
  // 08 admit + result
  hl(641, 820, 194, 86, 108.2, 110.4),
  hl(843, 820, 193, 86, 110.4, 113.3),
  hl(35, 945, 1010, 160, 113.6, 122.4),
  // 09 deadline tracker
  hl(25, 2120, 1030, 165, 123.0, 125.6),
  hl(50, 2140, 180, 140, 125.6, 129.0),
  hl(211, 682, 657, 94, 133.7, 136.2),
  hl(77, 860, 300, 120, 136.6, 138.2),
  hl(130, 1010, 820, 205, 138.2, 140.3),
  hl(70, 1240, 160, 60, 140.5, 142.5),
  // 10 my calendar
  hl(255, 2140, 170, 140, 142.8, 145.4),
  hl(35, 947, 1010, 795, 146.2, 153.0),
  hl(184, 818, 712, 95, 153.2, 158.2),
  hl(36, 1036, 105, 705, 158.3, 161.0),
  hl(36, 1177, 1010, 140, 161.2, 165.0),
  // 11 study tracker
  hl(680, 2140, 130, 140, 166.4, 169.5),
  hl(700, 951, 311, 93, 169.5, 172.5),
  hl(35, 827, 1010, 1243, 172.5, 176.6),
  // 12 AI helper
  hl(34, 1938, 146, 146, 178.0, 184.7, { at: 184.8, x: 107, y: 2011 }),
  hl(75, 1043, 748, 190, 187.0, 193.0),
  hl(797, 535, 95, 95, 195.3, 197.3, { at: 197.0, x: 845, y: 582 }),
  hl(80, 1370, 920, 120, 197.6, 199.8),
  hl(80, 790, 900, 450, 200.5, 203.4),
  hl(80, 1715, 920, 115, 203.6, 207.0),
  // 13 more tools
  hl(362, 238, 672, 548, 207.4, 209.9),
  hl(362, 238, 672, 118, 209.9, 212.0),
  hl(362, 381, 672, 118, 212.0, 213.7),
  hl(362, 524, 672, 118, 213.7, 216.0),
  hl(362, 667, 672, 118, 216.0, 218.4),
  hl(362, 524, 672, 118, 218.6, 224.0),
  hl(362, 1838, 672, 415, 224.4, 229.0),
  // 14 PDF
  hl(472, 564, 574, 70, 230.0, 234.2),
  hl(57, 697, 966, 1210, 234.6, 239.2),
  // 15 offline
  hl(35, 103, 212, 75, 246.2, 251.0),
  hl(35, 945, 1010, 1175, 251.2, 254.6),
  // 16 widgets
  hl(878, 693, 120, 110, 256.6, 258.9, { at: 258.5, x: 938, y: 748 }),
  hl(320, 1787, 440, 237, 259.4, 262.0),
  hl(72, 752, 438, 234, 262.5, 264.6),
  hl(321, 457, 439, 234, 264.6, 266.4),
  hl(72, 457, 688, 529, 266.6, 268.4),
];

const INTRO = { end: 12.0, tag: "App Guide", title: "Admission Calendar", sub: "ভর্তির সব তথ্য এক জায়গায়" };

const SCENES: Scene[] = [
  { start: 12.0, end: 32.9, title: "লাইট / ডার্ক মোড", sub: "এক সুইচেই থিম বদলান" },
  { start: 32.9, end: 46.4, title: "সর্বশেষ আপডেট", sub: "Telegram ও Facebook-এ জয়েন করুন" },
  { start: 46.4, end: 58.0, title: "ব্রেকিং নিউজ বার", sub: "জরুরি ঘোষণা ভেসে ভেসে আসে" },
  { start: 58.0, end: 65.0, title: "সার্চ বক্স", sub: "নাম লিখলেই বিশ্ববিদ্যালয় খুঁজে পাবেন" },
  { start: 65.0, end: 81.8, title: "সময়কাল", sub: "পরীক্ষার তারিখ ও লাইভ কাউন্টডাউন" },
  { start: 81.8, end: 91.2, title: "তথ্য", sub: "লোগোসহ বিশ্ববিদ্যালয়ের কার্ড" },
  { start: 91.2, end: 107.8, title: "আবেদন", sub: "সময়, ফি ও সরাসরি Apply বাটন" },
  { start: 107.8, end: 122.6, title: "অ্যাডমিট ও ফলাফল", sub: "প্রকাশ হলেই এখানে যুক্ত হবে" },
  { start: 122.6, end: 142.6, title: "ডেডলাইন ট্র্যাকার", sub: "নিজের কাজের কাউন্টডাউন" },
  { start: 142.6, end: 165.2, title: "মাই ক্যালেন্ডার", sub: "শুধু আপনার বিশ্ববিদ্যালয়গুলো" },
  { start: 165.2, end: 176.8, title: "স্টাডি ট্র্যাকার", sub: "প্রতিদিনের পড়ার সময় ও গ্রাফ" },
  { start: 176.8, end: 207.2, title: "AI সহায়ক", sub: "ভর্তি নিয়ে যেকোনো প্রশ্ন" },
  { start: 207.2, end: 229.1, title: "আরও কিছু টুল", sub: "সিলেবাস, ক্যালকুলেটর, রিসাইজার" },
  { start: 229.1, end: 243.4, title: "টাইমটেবিল PDF", sub: "শুধু ওয়েবসাইটে পাওয়া যায়" },
  { start: 243.4, end: 254.8, title: "অফলাইনেও চলে", sub: "ইন্টারনেট না থাকলেও চিন্তা নেই" },
  { start: 254.8, end: OUTRO_START, title: "হোম স্ক্রিন উইজেট", sub: "অ্যাপ না খুলেই কতদিন বাকি দেখুন" },
];

/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */
const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        height: 6,
        width: (frame / DURATION) * W,
        background: C.ink,
      }}
    />
  );
};

const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  const enter = interpolate(frame, [0, f(1.1)], [0, 1], { ...clamp, easing: ease });
  const exit = interpolate(frame, [f(OUTRO_START), f(OUTRO_START + 0.9)], [0, 1], {
    ...clamp,
    easing: ease,
  });
  const taps = HIGHLIGHTS.flatMap((h) => (h.tap ? [h.tap] : []));

  return (
    <div
      style={{
        position: "absolute",
        left: PHONE_LEFT,
        top: PHONE_TOP,
        width: PHONE_W,
        height: PHONE_H,
        boxSizing: "border-box",
        padding: BEZEL,
        borderRadius: 66,
        background: C.ink,
        boxShadow: "0 28px 70px rgba(0,0,0,0.16)",
        opacity: enter * (1 - exit),
        translate: `0px ${(1 - enter) * 140 + exit * 160}px`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: SCREEN_W,
          height: SCREEN_H,
          borderRadius: 54,
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        {/* screenshots, cross-faded */}
        {SHOTS.map((s, i) => {
          const next = SHOTS[i + 1];
          if (t < s.from - 0.5) return null;
          if (next && t > next.from + SHOT_FADE + 0.1) return null;
          const opacity =
            i === 0 ? 1 : interpolate(t, [s.from, s.from + SHOT_FADE], [0, 1], clamp);
          return (
            <Img
              key={`${s.file}-${i}`}
              src={staticFile(s.file)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity,
              }}
            />
          );
        })}

        {/* spotlight highlights */}
        {HIGHLIGHTS.map((h, i) => {
          const a = interpolate(
            t,
            [h.from - 0.15, h.from + 0.15, h.to - 0.15, h.to + 0.15],
            [0, 1, 1, 0],
            clamp,
          );
          if (a <= 0) return null;
          const pad = 10;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: h.x * K - pad,
                top: h.y * K - pad,
                width: h.w * K + pad * 2,
                height: h.h * K + pad * 2,
                boxSizing: "border-box",
                borderRadius: 22,
                border: "3px solid #ffffff",
                boxShadow: "0 0 0 6px rgba(0,0,0,0.9), 0 0 0 3000px rgba(0,0,0,0.5)",
                opacity: a,
              }}
            />
          );
        })}

        {/* tap ripples */}
        {taps.map((tp, i) => {
          const p = (t - tp.at) / 0.8;
          if (p < 0 || p > 1) return null;
          const size = interpolate(p, [0, 1], [34, 120]);
          const opacity = interpolate(p, [0, 0.2, 1], [0, 1, 0]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: tp.x * K - size / 2,
                top: tp.y * K - size / 2,
                width: size,
                height: size,
                boxSizing: "border-box",
                borderRadius: "50%",
                border: "5px solid #ffffff",
                background: "rgba(10,10,10,0.35)",
                boxShadow: "0 0 0 3px rgba(0,0,0,0.8)",
                opacity,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const Heading: React.FC<{ tag: string; title: string; sub: string; dur: number }> = ({
  tag,
  title,
  sub,
  dur,
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, f(0.6)], [0, 1], { ...clamp, easing: ease });
  const exit = interpolate(frame, [dur - f(0.3), dur], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        top: 92,
        opacity: enter * (1 - exit),
        translate: `0px ${(1 - enter) * 30}px`,
      }}
    >
      <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.25, color: C.mute }}>{tag}</div>
      <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.25, color: C.ink, marginTop: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 44, fontWeight: 400, lineHeight: 1.35, color: C.mute, marginTop: 6 }}>
        {sub}
      </div>
    </div>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = (at: number) =>
    interpolate(frame, [f(at), f(at + 0.7)], [0, 1], { ...clamp, easing: ease });
  const line = (at: number, size: number, weight: number, color: string, text: string) => (
    <div
      style={{
        fontSize: size,
        fontWeight: weight,
        color,
        lineHeight: 1.35,
        marginTop: 14,
        opacity: reveal(at),
        translate: `0px ${(1 - reveal(at)) * 30}px`,
      }}
    >
      {text}
    </div>
  );
  return (
    <AbsoluteFill
      style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 80px",
      }}
    >
      <div
        style={{
          fontSize: 150,
          fontWeight: 800,
          lineHeight: 1.02,
          letterSpacing: -3,
          color: C.ink,
          opacity: reveal(0.4),
          translate: `0px ${(1 - reveal(0.4)) * 40}px`,
        }}
      >
        Admission
        <br />
        Calendar
      </div>
      <div
        style={{
          width: 120,
          height: 6,
          borderRadius: 3,
          background: C.ink,
          margin: "56px 0 42px",
          opacity: reveal(1.6),
        }}
      />
      {line(2.0, 64, 700, C.ink, "আজই ডাউনলোড করুন")}
      {line(3.6, 44, 400, C.mute, "পছন্দের বিশ্ববিদ্যালয়গুলো যোগ করে ফেলুন")}
      {line(5.8, 44, 400, C.mute, "কোনো তারিখ যেন মিস না হয়")}
      {line(8.8, 56, 600, C.ink, "আল্লাহ হাফেজ")}
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: FONT }}>
      <Audio src={staticFile(AUDIO_FILE)} />
      <ProgressBar />
      <Phone />

      <Sequence name="Intro" from={0} durationInFrames={f(INTRO.end)}>
        <Heading tag={INTRO.tag} title={INTRO.title} sub={INTRO.sub} dur={f(INTRO.end)} />
      </Sequence>

      {SCENES.map((s, i) => {
        const dur = f(s.end) - f(s.start);
        return (
          <Sequence key={s.title} name={s.title} from={f(s.start)} durationInFrames={dur}>
            <Heading
              tag={`${String(i + 1).padStart(2, "0")} / ${String(SCENES.length).padStart(2, "0")}`}
              title={s.title}
              sub={s.sub}
              dur={dur}
            />
          </Sequence>
        );
      })}

      <Sequence name="Outro" from={f(OUTRO_START)} durationInFrames={DURATION - f(OUTRO_START)}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition
    id="Main"
    component={Main}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={DURATION}
  />
);

registerRoot(Root);
