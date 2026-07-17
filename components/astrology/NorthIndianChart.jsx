'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
               'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_ABBR = ['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];
const SHORT = {
  Sun:'Su', Moon:'Mo', Mars:'Ma', Mercury:'Me', Jupiter:'Ju',
  Venus:'Ve', Saturn:'Sa', Rahu:'Ra', Ketu:'Ke',
  Gulika:'Gu', Maandi:'Mn',
};

// Centroid positions for 12 houses in a 300x300 North Indian diamond layout.
// Scaled from the AshtakaNorthChart geometry (100x100 with offset) to 300x300.
// House 1 = top center, numbered counter-clockwise.
const NIC_CENTROID = {
  1:  [150, 75],   2:  [75, 37],    3:  [37, 75],
  4:  [75, 150],   5:  [37, 225],   6:  [75, 262],
  7:  [150, 225],  8:  [225, 262],  9:  [262, 225],
  10: [225, 150],  11: [262, 75],   12: [225, 37],
};

export default function NorthIndianChart({ title, ascSign, placements, className }) {
  // Build house-based placement: house h (1-12) contains planets from sign (ascSign + h - 1) % 12
  const houses = {};
  for (let h = 1; h <= 12; h++) {
    const signIdx = (ascSign + h - 1) % 12;
    houses[h] = {
      sign: signIdx,
      bodies: placements[signIdx] || [],
    };
  }

  return (
    <Card className={`bg-slate-900/60 border-slate-800 ${className || ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-200 text-sm font-medium tracking-wide">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-square">
          <svg viewBox="0 0 300 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Outer square */}
            <rect x="0" y="0" width="300" height="300" fill="none" stroke="#334155" strokeWidth="1.5" />
            {/* Diagonals */}
            <line x1="0" y1="0" x2="300" y2="300" stroke="#334155" strokeWidth="0.8" />
            <line x1="300" y1="0" x2="0" y2="300" stroke="#334155" strokeWidth="0.8" />
            {/* Inner diamond */}
            <polygon points="150,0 300,150 150,300 0,150" fill="none" stroke="#334155" strokeWidth="0.8" />

            {/* House 1 saffron highlight (top center triangle) */}
            <polygon points="0,0 150,0 0,150" fill="rgba(245,158,11,0.08)" stroke="none" />
            <polygon points="150,0 300,0 300,150" fill="rgba(245,158,11,0.08)" stroke="none" />

            {/* Render house labels and planets at centroids */}
            {Object.entries(houses).map(([hStr, { sign, bodies }]) => {
              const h = Number(hStr);
              const [cx, cy] = NIC_CENTROID[h];
              const isLagna = h === 1;
              // Limit displayed planets to avoid overflow
              const maxShow = 5;
              const shown = bodies.slice(0, maxShow);
              const overflow = bodies.length - maxShow;
              return (
                <g key={h}>
                  {/* House number and sign abbreviation */}
                  <text x={cx} y={cy - 14} textAnchor="middle" fontSize="10"
                    fill={isLagna ? '#f59e0b' : '#64748b'} fontWeight={isLagna ? '600' : '400'}>
                    H{h}
                  </text>
                  <text x={cx} y={cy - 3} textAnchor="middle" fontSize="9" fill="#7c83f7">
                    {SIGN_ABBR[sign]}
                  </text>
                  {/* Planet abbreviations */}
                  {shown.map((b, i) => (
                    <text key={i} x={cx} y={cy + 9 + i * 11} textAnchor="middle" fontSize="9"
                      fill={
                        b.isAsc ? '#fcd34d' :
                        b.isUpa ? '#c4b5fd' :
                        b.name === 'Rahu' || b.name === 'Ketu' ? '#f0abfc' :
                        '#e2e8f0'
                      }
                      fontWeight={b.isAsc ? '600' : '400'}>
                      {b.isAsc ? 'Asc' : SHORT[b.name] || b.name}
                      {b.deg !== undefined ? ` ${b.deg.toFixed(1)}°` : ''}
                    </text>
                  ))}
                  {overflow > 0 && (
                    <text x={cx} y={cy + 9 + shown.length * 11} textAnchor="middle" fontSize="8" fill="#64748b">
                      +{overflow}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center label */}
            <text x="150" y="146" textAnchor="middle" fontSize="9" fill="#64748b" letterSpacing="1">
              NORTH INDIAN
            </text>
            <text x="150" y="160" textAnchor="middle" fontSize="8" fill="#475569">
              Asc: {SIGNS[ascSign]}
            </text>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
