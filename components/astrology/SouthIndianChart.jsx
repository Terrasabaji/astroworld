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
const SI_LAYOUT = [
  [11, 0, 1, 2],
  [10,-1,-1, 3],
  [ 9,-1,-1, 4],
  [ 8, 7, 6, 5],
];

export default function SouthIndianChart({
  title, ascSign, placements, cuspHouseLabels, centerLabel, centerSubtitle, showBhavaShift,
}) {
  const houseLabelForSign = (si) => {
    if (cuspHouseLabels?.[si]?.length) {
      return cuspHouseLabels[si].map((h) => `H${h}`).join('·');
    }
    return `H${((si - ascSign + 12) % 12) + 1}`;
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-200 text-sm font-medium tracking-wide">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 grid-rows-4 aspect-square border border-slate-700 bg-slate-950/50 rounded-md overflow-hidden">
          {SI_LAYOUT.flat().map((si, idx) => {
            const r = Math.floor(idx / 4), c = idx % 4;
            if (si === -1) {
              if (r === 1 && c === 1) {
                return (
                  <div key="center" className="col-span-2 row-span-2 border border-slate-800 flex items-center justify-center bg-slate-900/40">
                    <div className="text-center px-2">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">
                        {centerLabel || 'South Indian'}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {centerSubtitle || 'Fixed signs, houses rotate'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2">Asc: {SIGNS[ascSign]}</div>
                    </div>
                  </div>
                );
              }
              return null;
            }
            const houseNum = ((si - ascSign + 12) % 12) + 1;
            const isAscHouse = houseNum === 1;
            const bodies = placements[si] || [];
            return (
              <div key={idx} className={`relative border border-slate-800 p-1 text-[10px] leading-tight ${isAscHouse ? 'bg-saffron-500/10' : 'bg-slate-950/30'}`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-slate-500">{SIGN_ABBR[si]}</span>
                  <span className={`text-[9px] truncate ${isAscHouse ? 'text-saffron-400 font-semibold' : 'text-cyan-400/80'}`}>
                    {houseLabelForSign(si)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-1 gap-y-0.5">
                  {bodies.map((b, i) => (
                    <span key={i} className={`inline-flex items-center gap-0.5 ${
                      b.isAsc ? 'text-saffron-300 font-semibold' :
                      b.isUpa ? 'text-violet-300' :
                      b.name === 'Rahu' || b.name === 'Ketu' ? 'text-fuchsia-300' :
                      'text-slate-200'}`}>
                      <span>{b.isAsc ? 'Asc' : SHORT[b.name] || b.name}</span>
                      {b.deg !== undefined && <span className="text-slate-500 text-[9px]">{b.deg.toFixed(1)}°</span>}
                      {showBhavaShift && b.rasiSign !== undefined && b.rasiSign !== si && (
                        <span className="text-[8px] text-cyan-400" title={`Rasi: ${SIGN_ABBR[b.rasiSign]}`}>→{SIGN_ABBR[b.rasiSign]}</span>
                      )}
                      {b.retrograde && <span className="text-rose-400 text-[8px]">R</span>}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
