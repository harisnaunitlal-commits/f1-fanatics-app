function FiaGlobe({ size, outerFill, color }: { size: number; outerFill: string; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" style={{ flexShrink: 0 }}>
      <circle cx="17" cy="17" r="16" fill={outerFill} />
      <circle cx="17" cy="17" r="12" fill="white" />
      <ellipse cx="17" cy="17" rx="5" ry="12" fill="none" stroke={color} strokeWidth="1.2" />
      <ellipse cx="17" cy="17" rx="9" ry="12" fill="none" stroke={color} strokeWidth="1" />
      <line x1="5" y1="17" x2="29" y2="17" stroke={color} strokeWidth="1" />
      <line x1="6" y1="12" x2="28" y2="12" stroke={color} strokeWidth="0.8" />
      <line x1="6" y1="22" x2="28" y2="22" stroke={color} strokeWidth="0.8" />
      <circle cx="17" cy="17" r="12" fill="none" stroke={color} strokeWidth="1.2" />
      <text x="17" y="20" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="5.5" fontWeight="900" fill={color}>FIA</text>
    </svg>
  )
}

export default function P14Badge({ value }: { value: string }) {
  const base: React.CSSProperties = {
    width: '100%', height: '54px', borderRadius: '8px',
    overflow: 'hidden', display: 'flex', alignItems: 'center', flexShrink: 0,
  }

  if (value === 'SC') {
    return (
      <div style={{ ...base, background: '#cc0000' }}>
        <div style={{ padding: '0 4px' }}>
          <FiaGlobe size={38} outerFill="rgba(255,255,255,0.18)" color="#cc0000" />
        </div>
        <span style={{ color: 'white', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: '12px', lineHeight: 1.15, letterSpacing: '0.5px' }}>
          SAFETY<br />CAR
        </span>
      </div>
    )
  }

  if (value === 'VSC') {
    return (
      <div style={{ ...base, background: '#F5C400' }}>
        <div style={{ padding: '0 4px' }}>
          <FiaGlobe size={38} outerFill="#0a1464" color="#0a1464" />
        </div>
        <span style={{ color: '#0a1464', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: '10px', lineHeight: 1.15, letterSpacing: '0.3px' }}>
          VIRTUAL<br />SAFETY CAR
        </span>
      </div>
    )
  }

  if (value === 'AMBOS') {
    return (
      <div style={{ ...base, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, background: '#cc0000' }}>
          <div style={{ padding: '0 3px' }}>
            <FiaGlobe size={28} outerFill="rgba(255,255,255,0.18)" color="#cc0000" />
          </div>
          <span style={{ color: 'white', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: '10px', lineHeight: 1.1, paddingRight: '4px' }}>SC</span>
        </div>
        <div style={{ width: '2px', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, background: '#F5C400' }}>
          <div style={{ padding: '0 3px' }}>
            <FiaGlobe size={28} outerFill="#0a1464" color="#0a1464" />
          </div>
          <span style={{ color: '#0a1464', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: '8.5px', lineHeight: 1.15, paddingRight: '4px' }}>VSC</span>
        </div>
      </div>
    )
  }

  // Red Flag badge helper
  function RfBlock({ flex = 1, small = false }: { flex?: number; small?: boolean }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', flex, background: '#b30000', position: 'relative', overflow: 'hidden' }}>
        {/* diagonal stripe pattern */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }} viewBox="0 0 40 54" preserveAspectRatio="none">
          {[-10,-4,2,8,14,20,26,32,38,44].map(x => (
            <line key={x} x1={x} y1="0" x2={x+20} y2="54" stroke="white" strokeWidth="5" />
          ))}
        </svg>
        <div style={{ padding: small ? '0 3px' : '0 5px', zIndex: 1 }}>
          <svg width={small ? 22 : 30} height={small ? 22 : 30} viewBox="0 0 30 30" style={{ flexShrink: 0 }}>
            <rect width="30" height="30" rx="3" fill="rgba(255,255,255,0.12)" />
            <text x="15" y="20" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="11" fontWeight="900" fill="white">🚩</text>
          </svg>
        </div>
        <span style={{ color: 'white', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: small ? 8 : 10, lineHeight: 1.15, letterSpacing: '0.3px', zIndex: 1, paddingRight: small ? 3 : 5 }}>
          {small ? 'RF' : 'RED\nFLAG'}
        </span>
      </div>
    )
  }

  if (value === 'RF') {
    return (
      <div style={{ ...base }}>
        <RfBlock />
      </div>
    )
  }

  if (value === 'RF_SC') {
    return (
      <div style={{ ...base, alignItems: 'stretch' }}>
        <RfBlock flex={1} small />
        <div style={{ width: '2px', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, background: '#cc0000' }}>
          <div style={{ padding: '0 3px' }}>
            <FiaGlobe size={26} outerFill="rgba(255,255,255,0.18)" color="#cc0000" />
          </div>
          <span style={{ color: 'white', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: 9, lineHeight: 1.1, paddingRight: 4 }}>SC</span>
        </div>
      </div>
    )
  }

  if (value === 'RF_VSC') {
    return (
      <div style={{ ...base, alignItems: 'stretch' }}>
        <RfBlock flex={1} small />
        <div style={{ width: '2px', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, background: '#F5C400' }}>
          <div style={{ padding: '0 3px' }}>
            <FiaGlobe size={26} outerFill="#0a1464" color="#0a1464" />
          </div>
          <span style={{ color: '#0a1464', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: 8, lineHeight: 1.15, paddingRight: 4 }}>VSC</span>
        </div>
      </div>
    )
  }

  if (value === 'RF_AMBOS') {
    return (
      <div style={{ ...base, alignItems: 'stretch' }}>
        <RfBlock flex={1} small />
        <div style={{ width: '2px', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, background: '#cc0000' }}>
          <div style={{ padding: '0 2px' }}>
            <FiaGlobe size={20} outerFill="rgba(255,255,255,0.18)" color="#cc0000" />
          </div>
          <span style={{ color: 'white', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: 8, lineHeight: 1.1 }}>SC</span>
        </div>
        <div style={{ width: '1px', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, background: '#F5C400' }}>
          <div style={{ padding: '0 2px' }}>
            <FiaGlobe size={20} outerFill="#0a1464" color="#0a1464" />
          </div>
          <span style={{ color: '#0a1464', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: 7, lineHeight: 1.15 }}>VSC</span>
        </div>
      </div>
    )
  }

  if (value === 'NENHUM') {
    return (
      <div style={{ ...base, justifyContent: 'center', gap: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <svg width="72" height="44" viewBox="0 0 72 44">
          <rect x="1" y="3" width="32" height="17" rx="3" fill="#cc0000" fillOpacity="0.4" />
          <text x="17" y="15" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="8" fontWeight="900" fill="white" fillOpacity="0.5">SC</text>
          <line x1="1" y1="3" x2="33" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="1" y="24" width="32" height="16" rx="3" fill="#F5C400" fillOpacity="0.4" />
          <text x="17" y="36" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="7" fontWeight="900" fill="#0a1464" fillOpacity="0.5">VSC</text>
          <line x1="1" y1="24" x2="33" y2="40" stroke="#0a1464" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.6" />
          <text x="54" y="18" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="8" fontWeight="900" fill="#22c55e">PISTA</text>
          <text x="54" y="30" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="8" fontWeight="900" fill="#22c55e">LIMPA</text>
        </svg>
      </div>
    )
  }

  // Binary fallback (Sim / Não) — just text
  return (
    <div style={{ ...base, justifyContent: 'center', background: 'transparent' }}>
      <span style={{ color: 'inherit', fontWeight: 700, fontSize: '16px' }}>{value}</span>
    </div>
  )
}
