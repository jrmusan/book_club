import type { CSSProperties } from "react";
import styles from "./cozy-window.module.css";

function seeded(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = seeded(1987);
const round = (n: number) => Math.round(n * 100) / 100;
const drift = () => `${round(rand() * 36 - 18)}px`;

const STARS = Array.from({ length: 44 }, () => ({
  left: round(rand() * 100),
  top: round(rand() * 55),
  size: round(1 + rand() * 2.2),
  dur: round(1.8 + rand() * 2.6),
  delay: round(rand() * 3),
}));

const FIREFLIES = Array.from({ length: 14 }, () => ({
  left: round(8 + rand() * 84),
  top: round(45 + rand() * 33),
  dur: round(4 + rand() * 4),
  delay: round(rand() * 4),
  glow: round(1.6 + rand() * 1.8),
  x1: drift(),
  y1: drift(),
  x2: drift(),
  y2: drift(),
  x3: drift(),
  y3: drift(),
}));

const CLOUDS = [
  { top: 10, width: 22, dur: 70, delay: -12 },
  { top: 22, width: 15, dur: 95, delay: -60 },
  { top: 4, width: 12, dur: 120, delay: -95 },
];

const SPARKLES = [
  { top: 3, left: 22, size: 14, dur: 3.2, delay: 0 },
  { top: 10, left: 80, size: 11, dur: 2.6, delay: 1.1 },
  { top: 42, left: 1, size: 12, dur: 3.6, delay: 0.6 },
  { top: 58, left: 96, size: 15, dur: 3, delay: 1.8 },
  { top: 0, left: 55, size: 9, dur: 2.4, delay: 2.2 },
  { top: 78, left: 4, size: 10, dur: 3.4, delay: 1.4 },
];

const SPARKLE_PATH =
  "M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z";

function cssVars(vars: Record<string, string>) {
  return vars as CSSProperties;
}

function HangingPlant({ className, mirrored }: { className: string; mirrored?: boolean }) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 80 230"
        className={styles.hangingSvg}
        style={mirrored ? { transform: "scaleX(-1)" } : undefined}
      >
        <line x1="40" y1="0" x2="40" y2="58" className={styles.string} />
        <line x1="40" y1="58" x2="20" y2="92" className={styles.string} />
        <line x1="40" y1="58" x2="60" y2="92" className={styles.string} />

        <path
          d="M24 94 C12 120 10 150 18 178 C22 194 18 208 14 222"
          className={styles.vine}
        />
        <path
          d="M56 94 C68 118 70 146 62 170 C58 186 62 200 66 214"
          className={styles.vine}
        />
        <ellipse cx="14" cy="124" rx="7" ry="4" transform="rotate(-35 14 124)" className={styles.leaf2} />
        <ellipse cx="13" cy="156" rx="7" ry="4" transform="rotate(20 13 156)" className={styles.leaf3} />
        <ellipse cx="19" cy="186" rx="7" ry="4" transform="rotate(-25 19 186)" className={styles.leaf2} />
        <ellipse cx="16" cy="212" rx="6" ry="3.5" transform="rotate(15 16 212)" className={styles.leaf3} />
        <ellipse cx="67" cy="120" rx="7" ry="4" transform="rotate(35 67 120)" className={styles.leaf2} />
        <ellipse cx="66" cy="152" rx="7" ry="4" transform="rotate(-20 66 152)" className={styles.leaf3} />
        <ellipse cx="60" cy="182" rx="7" ry="4" transform="rotate(30 60 182)" className={styles.leaf2} />
        <ellipse cx="65" cy="206" rx="6" ry="3.5" transform="rotate(-15 65 206)" className={styles.leaf3} />

        <ellipse cx="40" cy="84" rx="16" ry="8" className={styles.leaf1} />
        <ellipse cx="28" cy="80" rx="12" ry="7" transform="rotate(-30 28 80)" className={styles.leaf2} />
        <ellipse cx="52" cy="79" rx="12" ry="7" transform="rotate(30 52 79)" className={styles.leaf2} />
        <ellipse cx="36" cy="72" rx="10" ry="6" transform="rotate(-15 36 72)" className={styles.leaf3} />
        <ellipse cx="46" cy="71" rx="10" ry="6" transform="rotate(18 46 71)" className={styles.leaf3} />
        <circle cx="31" cy="74" r="3" className={styles.blossom} />
        <circle cx="50" cy="68" r="2.6" className={styles.blossom} />

        <path d="M20 90 H60 L55 116 Q40 124 25 116 Z" className={styles.pot} />
        <rect x="17" y="86" width="46" height="8" rx="4" className={styles.potRim} />
      </svg>
    </div>
  );
}

export function CozyWindow() {
  return (
    <div className={styles.root} aria-hidden>
      {SPARKLES.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={styles.sparkle}
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            ...cssVars({ "--sdur": `${s.dur}s`, "--sdelay": `${s.delay}s` }),
          }}
        >
          <path d={SPARKLE_PATH} />
        </svg>
      ))}

      <div className={styles.windowWrap}>
        <div className={styles.rod}>
          <span className={styles.rodKnob} />
          <span className={styles.rodKnob} />
        </div>
        <HangingPlant className={styles.hangingLeft} />
        <HangingPlant className={styles.hangingRight} mirrored />

        <div className={styles.frame}>
          <div className={styles.glass}>
            <div className={styles.skyDay} />
            <div className={styles.skyNight} />
            <div className={styles.sunGlow} />

            <div className={styles.stars}>
              {STARS.map((s, i) => (
                <span
                  key={i}
                  className={styles.star}
                  style={{
                    left: `${s.left}%`,
                    top: `${s.top}%`,
                    width: s.size,
                    height: s.size,
                    ...cssVars({ "--dur": `${s.dur}s`, "--delay": `${s.delay}s` }),
                  }}
                />
              ))}
            </div>
            <span className={styles.shootingStar} />

            <div className={styles.moon} />
            <div className={styles.sun} />

            <div className={styles.clouds}>
              {CLOUDS.map((c, i) => (
                <svg
                  key={i}
                  viewBox="0 0 120 50"
                  className={styles.cloud}
                  style={{
                    top: `${c.top}%`,
                    width: `${c.width}%`,
                    ...cssVars({ "--cdur": `${c.dur}s`, "--cdelay": `${c.delay}s` }),
                  }}
                >
                  <path d="M20 40 Q4 40 6 28 Q8 16 22 18 Q26 4 44 6 Q58 -2 70 10 Q86 4 94 18 Q114 18 112 32 Q110 42 96 40 Z" />
                </svg>
              ))}
            </div>

            <svg viewBox="0 0 44 14" className={styles.birds}>
              <path d="M2 8 Q6 2 10 8 Q14 2 18 8" />
              <path d="M24 5 Q27 1 30 5 Q33 1 36 5" />
            </svg>

            <svg
              viewBox="0 0 640 280"
              preserveAspectRatio="xMidYMax slice"
              className={styles.hills}
            >
              <defs>
                <radialGradient id="cw-window-glow">
                  <stop offset="0%" stopColor="rgba(255, 205, 110, 0.85)" />
                  <stop offset="100%" stopColor="rgba(255, 205, 110, 0)" />
                </radialGradient>
              </defs>

              <path
                d="M0 150 C60 120 110 90 170 110 C230 130 260 70 330 80 C400 90 430 60 500 75 C560 88 600 110 640 100 V280 H0 Z"
                className={styles.hillFar}
              />
              <path
                d="M0 185 C70 160 120 150 190 165 C260 180 300 140 370 145 C440 150 480 170 560 160 C600 155 620 160 640 165 V280 H0 Z"
                className={styles.hillMid}
              />

              <rect x="117" y="150" width="5" height="14" className={styles.trunk} />
              <circle cx="119.5" cy="146" r="11" className={styles.tree} />
              <rect x="298" y="140" width="5" height="14" className={styles.trunk} />
              <circle cx="300.5" cy="136" r="13" className={styles.treeDark} />
              <polygon points="512,166 521,140 530,166" className={styles.tree} />
              <polygon points="530,168 540,136 550,168" className={styles.treeDark} />

              <g transform="translate(398 116)">
                <g className={styles.smoke}>
                  <circle cx="27" cy="-6" r="3" style={{ animationDelay: "0s" }} />
                  <circle cx="27" cy="-6" r="3" style={{ animationDelay: "1.3s" }} />
                  <circle cx="27" cy="-6" r="3" style={{ animationDelay: "2.6s" }} />
                </g>
                <rect x="24" y="-2" width="6" height="12" className={styles.chimney} />
                <path d="M-4 14 L18 -2 L40 14 Z" className={styles.roof} />
                <rect x="0" y="13" width="36" height="22" className={styles.walls} />
                <rect x="5" y="22" width="8" height="13" rx="3" className={styles.door} />
                <g className={styles.cottageGlow}>
                  <circle cx="25" cy="23" r="14" fill="url(#cw-window-glow)" />
                </g>
                <rect x="20" y="19" width="10" height="8" rx="1.5" className={styles.cottageWindow} />
              </g>

              <path
                d="M0 225 C80 200 150 205 230 215 C310 225 360 200 440 205 C520 210 580 225 640 215 V280 H0 Z"
                className={styles.hillNear}
              />
              <path
                d="M0 255 C100 240 200 250 320 245 C440 240 540 255 640 248 V280 H0 Z"
                className={styles.hillFront}
              />

              <circle cx="140" cy="232" r="2.4" className={styles.flowerRose} />
              <circle cx="152" cy="236" r="2" className={styles.flowerGold} />
              <circle cx="250" cy="226" r="2.2" className={styles.flowerLavender} />
              <circle cx="330" cy="222" r="2.4" className={styles.flowerRose} />
              <circle cx="342" cy="227" r="2" className={styles.flowerGold} />
              <circle cx="470" cy="218" r="2.2" className={styles.flowerLavender} />
            </svg>

            <div className={styles.fireflies}>
              {FIREFLIES.map((f, i) => (
                <span
                  key={i}
                  className={styles.firefly}
                  style={{
                    left: `${f.left}%`,
                    top: `${f.top}%`,
                    ...cssVars({
                      "--fdur": `${f.dur}s`,
                      "--fdelay": `${f.delay}s`,
                      "--gdur": `${f.glow}s`,
                      "--fx1": f.x1,
                      "--fy1": f.y1,
                      "--fx2": f.x2,
                      "--fy2": f.y2,
                      "--fx3": f.x3,
                      "--fy3": f.y3,
                    }),
                  }}
                />
              ))}
            </div>

            <div className={styles.mullions} />
            <div className={styles.shine} />
          </div>

          <div className={styles.curtainLeft}>
            <Curtain />
          </div>
          <div className={styles.curtainRight}>
            <Curtain />
          </div>
        </div>

        <svg viewBox="0 0 600 120" className={styles.sillDecor}>
          <defs>
            <radialGradient id="cw-flame-glow">
              <stop offset="0%" stopColor="rgba(255, 200, 100, 0.6)" />
              <stop offset="100%" stopColor="rgba(255, 200, 100, 0)" />
            </radialGradient>
          </defs>

          <g className={styles.plantLeaves}>
            <path d="M50 90 C40 72 30 62 22 46 C36 52 46 66 50 90 Z" className={styles.leaf1} />
            <path d="M50 90 C60 68 72 60 82 48 C70 56 58 68 50 90 Z" className={styles.leaf2} />
            <path d="M50 90 C48 64 50 44 56 26 C60 48 56 68 50 90 Z" className={styles.leaf3} />
            <path d="M50 90 C42 76 34 74 26 72 C38 72 46 80 50 90 Z" className={styles.leaf2} />
          </g>
          <path d="M26 92 H74 L68 120 H32 Z" className={styles.pot} />
          <rect x="22" y="86" width="56" height="9" rx="4" className={styles.potRim} />

          <rect x="108" y="96" width="150" height="24" rx="3" className={styles.book1} />
          <rect x="128" y="96" width="4" height="24" className={styles.bookBand} />
          <rect x="234" y="96" width="4" height="24" className={styles.bookBand} />
          <rect x="116" y="74" width="134" height="22" rx="3" className={styles.book2} />
          <rect x="134" y="74" width="4" height="22" className={styles.bookBand} />
          <rect x="226" y="74" width="4" height="22" className={styles.bookBand} />
          <rect x="124" y="54" width="118" height="20" rx="3" className={styles.book3} />
          <rect x="140" y="54" width="4" height="20" className={styles.bookBand} />
          <rect x="220" y="54" width="4" height="20" className={styles.bookBand} />

          <path
            d="M190 54 C176 58 160 60 140 58 C122 56 120 44 136 42"
            className={styles.tail}
          />
          <g className={styles.cat}>
            <ellipse cx="180" cy="40" rx="44" ry="16" className={styles.catFill} />
            <path d="M205 26 L208 12 L216 23 Z" className={styles.catFill} />
            <path d="M218 23 L227 11 L229 27 Z" className={styles.catFill} />
            <circle cx="216" cy="36" r="14" className={styles.catFill} />
            <ellipse cx="200" cy="54" rx="7" ry="4" className={styles.catFill} />
            <ellipse cx="188" cy="55" rx="7" ry="4" className={styles.catFill} />
            <path d="M209 37 Q212 40 215 37" className={styles.catEye} />
            <path d="M220 36 Q223 39 226 36" className={styles.catEye} />
            <circle cx="218" cy="41" r="1.3" className={styles.catNose} />
          </g>
          <text x="232" y="22" className={styles.zzz} style={{ animationDelay: "0s" }}>
            z
          </text>
          <text x="238" y="16" className={styles.zzz} style={{ animationDelay: "1.5s" }}>
            z
          </text>
          <text x="244" y="10" className={styles.zzz} style={{ animationDelay: "3s" }}>
            z
          </text>

          <path
            d="M446 84 C440 74 452 68 446 58 C440 48 450 42 446 34"
            className={styles.steam}
            style={{ animationDelay: "0s" }}
          />
          <path
            d="M456 82 C450 72 462 66 456 56 C450 46 460 40 456 30"
            className={styles.steam}
            style={{ animationDelay: "1.1s" }}
          />
          <path
            d="M466 84 C460 74 472 68 466 58 C460 48 470 42 466 34"
            className={styles.steam}
            style={{ animationDelay: "2.2s" }}
          />
          <ellipse cx="455" cy="117" rx="34" ry="5" className={styles.porcelain} />
          <path d="M482 97 C494 96 494 110 480 110" className={styles.handle} />
          <path
            d="M428 92 H482 C482 108 472 116 455 116 C438 116 428 108 428 92 Z"
            className={styles.porcelain}
          />
          <ellipse cx="455" cy="92" rx="27" ry="4" className={styles.tea} />
          <path
            d="M455 108 C452 104 447 106 449 100 C450 97 454 98 455 101 C456 98 460 97 461 100 C463 106 458 104 455 108 Z"
            className={styles.heart}
          />

          <g className={styles.flame}>
            <circle cx="545" cy="58" r="18" fill="url(#cw-flame-glow)" className={styles.flameGlow} />
            <g className={styles.flameBody}>
              <path d="M545 46 C551 54 552 60 545 66 C538 60 539 54 545 46 Z" className={styles.flameOuter} />
              <path d="M545 53 C548 57 548 61 545 64 C542 61 542 57 545 53 Z" className={styles.flameInner} />
            </g>
          </g>
          <line x1="545" y1="72" x2="545" y2="65" className={styles.wick} />
          <rect x="537" y="72" width="16" height="40" rx="3" className={styles.wax} />
          <path d="M540 72 v9 a2 2 0 0 0 4 0 v-9 Z" className={styles.wax} />
          <rect x="530" y="110" width="30" height="7" rx="3" className={styles.holder} />
          <ellipse cx="545" cy="117" rx="22" ry="3.5" className={styles.holder} />
        </svg>

        <div className={styles.sill} />
      </div>

      <p className={styles.quote}>
        <span className={styles.quoteDay}>&ldquo;A good book is a window you can climb through.&rdquo;</span>
        <span className={styles.quoteNight}>&ldquo;Some stories are best read by candlelight.&rdquo;</span>
      </p>
    </div>
  );
}

function Curtain() {
  return (
    <svg viewBox="0 0 60 320" preserveAspectRatio="none" className={styles.curtainSvg}>
      <path
        d="M0 0 H58 C54 50 44 110 26 168 C34 205 48 262 56 320 H0 Z"
        className={styles.curtainFill}
      />
      <path d="M14 0 C14 60 12 120 10 172 C12 220 14 270 14 320" className={styles.curtainFold} />
      <path d="M32 0 C30 60 24 120 18 170 C24 220 30 270 34 320" className={styles.curtainFold} />
      <ellipse cx="22" cy="170" rx="15" ry="5" className={styles.curtainTie} />
    </svg>
  );
}
