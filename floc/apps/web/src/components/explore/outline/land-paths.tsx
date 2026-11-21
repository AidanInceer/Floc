type Islet = { x: number; y: number; r: number };

const EDGE = 0.75;
const edgeClass = "stroke-rule-strong";

export function LandPaths({ home, other, islets = [], fill }: { home: string; other: string; islets?: readonly Islet[]; fill: string }) {
  return (
    <>
      <path d={home} className={fill} />
      <path d={other} className="fill-sheet-3" />
      {islets.map((islet) => (
        <circle key={`fill ${islet.x} ${islet.y}`} cx={islet.x} cy={islet.y} r={islet.r} className={fill} />
      ))}
      <path d={other + home} fill="none" strokeWidth={EDGE} strokeLinejoin="round" className={edgeClass} />
      {islets.map((islet) => (
        <circle key={`edge ${islet.x} ${islet.y}`} cx={islet.x} cy={islet.y} r={islet.r} fill="none" strokeWidth={EDGE} className={edgeClass} />
      ))}
    </>
  );
}
