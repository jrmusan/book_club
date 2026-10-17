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
  round,
  seeded,
} from "./window-scene";

const BOOK_COLORS = [
  styles.book1,
  styles.book2,
  styles.book3,
  styles.book4,
  styles.book5,
  styles.book6,
];

type Book = {
  x: number;
  w: number;
  h: number;
  color: string;
  band: boolean;
  label: boolean;
  lean?: boolean;
};

/** Fills [x0, x1] with upright spines standing on `baseline`, optionally ending in a leaning book. */
function makeBookRow(
  rand: () => number,
  x0: number,
  x1: number,
  minH: number,
  maxH: number,
  lean: boolean,
  minW = 7,
  maxW = 15
): Book[] {
  const books: Book[] = [];
  const stop = lean ? x1 - maxH * 0.24 - minW - 4 : x1;
  let x = x0;
  while (true) {
    const w = round(minW + rand() * (maxW - minW));
    if (x + w > stop) break;
    books.push({
      x: round(x),
      w,
      h: round(minH + rand() * (maxH - minH)),
      color: BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)],
      band: rand() > 0.35,
      label: rand() > 0.55,
    });
    x += w + (rand() > 0.8 ? 1.4 : 0.5);
  }
  if (lean) {
    const h = round(minH + rand() * (maxH - minH) * 0.6);
    books.push({
      x: round(x + h * 0.24 + 1),
      w: minW + 2,
      h,
      color: BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)],
      band: true,
      label: false,
      lean: true,
    });
  }
  return books;
}

function BookSpines({ books, baseline }: { books: Book[]; baseline: number }) {
  return (
    <>
      {books.map((b, i) => {
        const y = baseline - b.h;
        return (
          <g key={i} transform={b.lean ? `rotate(-14 ${b.x} ${baseline})` : undefined}>
            <rect x={b.x} y={y} width={b.w} height={b.h} rx="1.5" className={b.color} />
            {b.band && (
              <>
                <rect x={b.x} y={y + b.h * 0.12} width={b.w} height="2.2" className={styles.bookBand} />
                <rect x={b.x} y={y + b.h * 0.82} width={b.w} height="2.2" className={styles.bookBand} />
              </>
            )}
            {b.label && (
              <rect
                x={b.x + 2}
                y={y + b.h * 0.38}
                width={Math.max(b.w - 4, 2)}
                height={b.h * 0.22}
                rx="1"
                className={styles.bookLabel}
              />
            )}
          </g>
        );
      })}
    </>
  );
}

const BOOKCASE_ROWS = [
  { baseline: 110, top: 52 },
  { baseline: 168, top: 116 },
  { baseline: 224, top: 174 },
];

function makeBookcase(seed: number, shortRow: number) {
  const rand = seeded(seed);
  return BOOKCASE_ROWS.map((row, i) => {
    const space = row.baseline - row.top;
    const x1 = i === shortRow ? 124 : 160;
    return makeBookRow(rand, 11, x1, space * 0.62, space * 0.94, rand() > 0.35);
  });
}

const LEFT_CASE = makeBookcase(311, 1);
const RIGHT_CASE = makeBookcase(733, 0);

function Succulent({ x, baseline }: { x: number; baseline: number }) {
  return (
    <g>
      <path d={`M${x + 4} ${baseline - 14} C${x - 4} ${baseline - 26} ${x + 2} ${baseline - 30} ${x + 10} ${baseline - 16} Z`} className={styles.leaf2} />
      <path d={`M${x + 20} ${baseline - 14} C${x + 28} ${baseline - 26} ${x + 22} ${baseline - 30} ${x + 14} ${baseline - 16} Z`} className={styles.leaf2} />
      <path d={`M${x + 12} ${baseline - 14} C${x + 6} ${baseline - 30} ${x + 18} ${baseline - 30} ${x + 12} ${baseline - 14} Z`} className={styles.leaf3} />
      <path d={`M${x + 2} ${baseline - 14} H${x + 22} L${x + 19} ${baseline} H${x + 5} Z`} className={styles.pot} />
    </g>
  );
}

function HeartJar({ x, baseline }: { x: number; baseline: number }) {
  return (
    <g>
      <rect x={x + 3} y={baseline - 30} width="16" height="5" rx="2" className={styles.holder} />
      <rect x={x} y={baseline - 26} width="22" height="26" rx="6" className={styles.porcelain} />
      <path
        d={`M${x + 11} ${baseline - 7} C${x + 7} ${baseline - 11} ${x + 4} ${baseline - 14} ${x + 7} ${baseline - 17} C${x + 9} ${baseline - 19} ${x + 11} ${baseline - 17} ${x + 11} ${baseline - 15} C${x + 11} ${baseline - 17} ${x + 13} ${baseline - 19} ${x + 15} ${baseline - 17} C${x + 18} ${baseline - 14} ${x + 15} ${baseline - 11} ${x + 11} ${baseline - 7} Z`}
        className={styles.heart}
      />
    </g>
  );
}

function CabinetShell() {
  return (
    <>
      <rect x="6" y="48" width="158" height="178" className={styles.cabinetBack} />
      <rect x="0" y="44" width="9" height="186" rx="2" className={styles.cabinetFrame} />
      <rect x="161" y="44" width="9" height="186" rx="2" className={styles.cabinetFrame} />
      <rect x="-4" y="40" width="178" height="10" rx="3" className={styles.cabinetFrame} />
      <rect x="-4" y="48" width="178" height="2" className={styles.cabinetEdge} />
      <rect x="4" y="110" width="162" height="6" rx="1.5" className={styles.cabinetFrame} />
      <rect x="4" y="168" width="162" height="6" rx="1.5" className={styles.cabinetFrame} />
      <rect x="0" y="224" width="170" height="6" rx="1.5" className={styles.cabinetFrame} />
    </>
  );
}

function LeftBookcase() {
  return (
    <div className={styles.bookcase}>
      <svg viewBox="0 0 170 230" className={styles.bookcaseSvg}>
        <CabinetShell />
        {LEFT_CASE.map((books, i) => (
          <BookSpines key={i} books={books} baseline={BOOKCASE_ROWS[i].baseline} />
        ))}
        <Succulent x={132} baseline={168} />

        <rect x="96" y="30" width="62" height="10" rx="2" className={styles.book5} />
        <rect x="102" y="21" width="52" height="9" rx="2" className={styles.book2} />
        <rect x="108" y="13" width="40" height="8" rx="2" className={styles.book4} />
        <rect x="118" y="21" width="3" height="9" className={styles.bookBand} />

        <g className={styles.trailingVine}>
          <path d="M24 32 C14 60 18 90 12 120 C8 140 14 160 10 176" className={styles.vine} />
          <path d="M36 34 C38 54 32 70 36 88" className={styles.vine} />
          <ellipse cx="16" cy="58" rx="6" ry="3.5" transform="rotate(-30 16 58)" className={styles.leaf2} />
          <ellipse cx="18" cy="84" rx="6" ry="3.5" transform="rotate(25 18 84)" className={styles.leaf3} />
          <ellipse cx="12" cy="108" rx="6" ry="3.5" transform="rotate(-20 12 108)" className={styles.leaf2} />
          <ellipse cx="11" cy="136" rx="6" ry="3.5" transform="rotate(20 11 136)" className={styles.leaf3} />
          <ellipse cx="12" cy="162" rx="5.5" ry="3.2" transform="rotate(-15 12 162)" className={styles.leaf2} />
          <ellipse cx="37" cy="58" rx="5.5" ry="3.2" transform="rotate(30 37 58)" className={styles.leaf3} />
          <ellipse cx="33" cy="80" rx="5.5" ry="3.2" transform="rotate(-25 33 80)" className={styles.leaf2} />
        </g>
        <ellipse cx="30" cy="25" rx="9" ry="6" transform="rotate(-25 30 25)" className={styles.leaf2} />
        <ellipse cx="44" cy="22" rx="9" ry="6" transform="rotate(25 44 22)" className={styles.leaf3} />
        <ellipse cx="37" cy="18" rx="7" ry="5" className={styles.leaf1} />
        <path d="M22 30 H58 L54 40 H26 Z" className={styles.pot} />
        <rect x="20" y="27" width="40" height="6" rx="3" className={styles.potRim} />
      </svg>
    </div>
  );
}

function RightBookcase() {
  return (
    <div className={styles.bookcase}>
      <svg viewBox="0 0 170 230" className={styles.bookcaseSvg}>
        <defs>
          <radialGradient id="cw-lamp-glow">
            <stop offset="0%" stopColor="rgba(255, 196, 150, 0.7)" />
            <stop offset="100%" stopColor="rgba(255, 196, 150, 0)" />
          </radialGradient>
        </defs>
        <CabinetShell />
        {RIGHT_CASE.map((books, i) => (
          <BookSpines key={i} books={books} baseline={BOOKCASE_ROWS[i].baseline} />
        ))}
        <HeartJar x={134} baseline={110} />

        <rect x="14" y="30" width="66" height="10" rx="2" className={styles.book3} />
        <rect x="20" y="21" width="54" height="9" rx="2" className={styles.book1} />
        <rect x="58" y="21" width="3" height="9" className={styles.bookBand} />

        <g className={styles.lampGlow}>
          <circle cx="132" cy="24" r="30" fill="url(#cw-lamp-glow)" />
        </g>
        <path d="M125 40 C125 33 127 28 129 26 H135 C137 28 139 33 139 40 Z" className={styles.wax} />
        <path d="M114 28 C114 12 150 12 150 28 Q132 32 114 28 Z" className={styles.mushroomCap} />
        <circle cx="124" cy="20" r="2.2" className={styles.walls} />
        <circle cx="136" cy="16" r="2.6" className={styles.walls} />
        <circle cx="144" cy="23" r="1.7" className={styles.walls} />
        <ellipse cx="132" cy="40" rx="12" ry="2.5" className={styles.holder} />
      </svg>
    </div>
  );
}

const SWAGS = 3;
const BULBS_PER_SWAG = 7;
const BULB_CLASSES = [styles.bulbGold, styles.bulbRose, styles.bulbSage, styles.bulbLavender];

const BULBS = Array.from({ length: SWAGS * BULBS_PER_SWAG }, (_, i) => {
  const swag = Math.floor(i / BULBS_PER_SWAG);
  const t = ((i % BULBS_PER_SWAG) + 0.5) / BULBS_PER_SWAG;
  return {
    left: round(((swag + t) / SWAGS) * 100),
    top: round(((2 + 40 * t * (1 - t)) / 20) * 100),
    color: BULB_CLASSES[i % BULB_CLASSES.length],
    dur: round(1.8 + ((i * 7) % 5) * 0.35),
    delay: round(((i * 3) % 7) * 0.3),
  };
});

function FairyLights() {
  return (
    <div className={styles.garland}>
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className={styles.garlandWire}>
        <path d="M0 2 Q16.67 22 33.33 2 Q50 22 66.67 2 Q83.33 22 100 2" />
      </svg>
      {BULBS.map((b, i) => (
        <span
          key={i}
          className={`${styles.bulb} ${b.color}`}
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            ...cssVars({ "--bdur": `${b.dur}s`, "--bdelay": `${b.delay}s` }),
          }}
        />
      ))}
    </div>
  );
}

const SILL_ROW = makeBookRow(seeded(58), 112, 252, 48, 78, true, 11, 20);

function OpenBook() {
  return (
    <g>
      <path d="M564 118 L620 113 L676 118 L676 121 L620 116 L564 121 Z" className={styles.book2} />
      <path d="M570 116 C588 108 606 108 620 113 L620 93 C606 88 588 88 570 96 Z" className={styles.page} />
      <path d="M670 116 C652 108 634 108 620 113 L620 93 C634 88 652 88 670 96 Z" className={styles.page} />
      <path d="M578 101 C592 96 604 96 614 99" className={styles.pageLine} />
      <path d="M578 107 C592 102 604 102 614 105" className={styles.pageLine} />
      <path d="M626 99 C636 96 648 96 662 101" className={styles.pageLine} />
      <path d="M626 105 C636 102 648 102 662 107" className={styles.pageLine} />
      <path d="M646 110 L646 122 L649.5 118.5 L653 122 L653 109.5 Z" className={styles.heart} />
      <path d="M670 116 C652 108 634 108 620 113 L620 93 C634 88 652 88 670 96 Z" className={styles.flipPage} />
    </g>
  );
}

const LONG_SPARKLES = [
  { top: -4, left: 20, size: 12, dur: 3.2, delay: 0 },
  { top: 6, left: 78, size: 10, dur: 2.8, delay: 1.2 },
  { top: -8, left: 50, size: 9, dur: 2.4, delay: 2 },
  { top: 30, left: 1, size: 11, dur: 3.6, delay: 0.7 },
  { top: 22, left: 98, size: 12, dur: 3, delay: 1.7 },
];

export function CozyLongWindow() {
  return (
    <div className={`${styles.tokens} ${styles.longRoot}`} aria-hidden>
      {LONG_SPARKLES.map((s, i) => (
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

      <div className={styles.longRow}>
        <LeftBookcase />

        <div className={styles.longWindowWrap}>
          <div className={styles.longFrameWrap}>
            <div className={styles.rod}>
              <span className={styles.rodKnob} />
              <span className={styles.rodKnob} />
            </div>
            <div className={styles.longFrame}>
              <div className={`${styles.longGlass} ${styles.wide}`}>
                <WindowScene variant="wide" glowId="cw-wide-window-glow" />
                <div className={styles.paneBars}>
                  <span />
                  <span />
                  <span />
                </div>
                <FairyLights />
                <div className={styles.shine} />
              </div>
              <div className={styles.longCurtainLeft}>
                <Curtain />
              </div>
              <div className={styles.longCurtainRight}>
                <Curtain />
              </div>
            </div>
          </div>

          <svg viewBox="0 0 1000 120" className={styles.longSillDecor}>
            <SillPlant transform="translate(8 0)" />
            <BookSpines books={SILL_ROW} baseline={120} />
            <SleepyCatOnBooks transform="translate(150 0)" />
            <OpenBook />
            <Teacup transform="translate(320 0)" />
            <Candle transform="translate(330 0)" glowId="cw-wide-flame-glow" />
            <rect x="915" y="104" width="72" height="16" rx="3" className={styles.book5} />
            <rect x="935" y="104" width="3" height="16" className={styles.bookBand} />
            <rect x="922" y="90" width="58" height="14" rx="3" className={styles.book4} />
            <rect x="962" y="90" width="3" height="14" className={styles.bookBand} />
          </svg>
        </div>

        <RightBookcase />
      </div>
      <div className={styles.ledge} />
    </div>
  );
}
