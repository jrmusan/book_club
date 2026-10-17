import styles from "./cozy.module.css";
import {
  Candle,
  Curtain,
  SillPlant,
  SleepyCatOnBooks,
  SPARKLE_PATH,
  Teacup,
  WindowScene,
  cssVars,
} from "./window-scene";

const SPARKLES = [
  { top: 3, left: 22, size: 14, dur: 3.2, delay: 0 },
  { top: 10, left: 80, size: 11, dur: 2.6, delay: 1.1 },
  { top: 42, left: 1, size: 12, dur: 3.6, delay: 0.6 },
  { top: 58, left: 96, size: 15, dur: 3, delay: 1.8 },
  { top: 0, left: 55, size: 9, dur: 2.4, delay: 2.2 },
  { top: 78, left: 4, size: 10, dur: 3.4, delay: 1.4 },
];

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
    <div className={`${styles.tokens} ${styles.root}`} aria-hidden>
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
            <WindowScene variant="tall" glowId="cw-tall-window-glow" />
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
          <SillPlant />
          <SleepyCatOnBooks />
          <Teacup />
          <Candle glowId="cw-tall-flame-glow" />
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
