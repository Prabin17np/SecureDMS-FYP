// src/components/SecurityMesh.jsx
//
// The one deliberate visual signature for the auth screens: a faint
// network topology (dots + connecting lines) drifting almost
// imperceptibly behind the login/register card. It's meant to read
// as "secure network," not as decoration for its own sake - kept low
// opacity and slow so it doesn't compete with the form itself.
// Respects prefers-reduced-motion globally (see index.css).

export default function SecurityMesh() {
  const nodes = [
    { x: 60, y: 80 }, { x: 220, y: 40 }, { x: 340, y: 140 },
    { x: 120, y: 220 }, { x: 300, y: 260 }, { x: 40, y: 320 },
    { x: 380, y: 60 }, { x: 260, y: 340 },
  ];

  const edges = [
    [0, 1], [1, 2], [1, 3], [2, 4], [3, 5], [2, 6], [4, 7], [0, 3],
  ];

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
      viewBox="0 0 420 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g className="animate-drift">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="#F8FAFC"
            strokeWidth="1"
          />
        ))}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r="3" fill="#F8FAFC" />
        ))}
      </g>
    </svg>
  );
}
