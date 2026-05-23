export default function NavTabs({ tab, setTab, pendingCount, holdingCount }) {
  const tabs = [
    { key: 'market',    label: '市場概覽' },
    { key: 'scanner',   label: '🔍 掃描選股' },
    { key: 'analysis',  label: '個股分析' },
    { key: 'signals',   label: '交易信號', badge: pendingCount },
    { key: 'portfolio', label: `持倉 (${holdingCount})` },
  ]
  return (
    <div style={{
      display: 'flex', background: '#090d1b',
      borderBottom: '1px solid #1e2d4d', padding: '0 8px', overflowX: 'auto',
    }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => setTab(t.key)} style={{
          padding: '9px 13px', fontSize: 12, whiteSpace: 'nowrap',
          background: 'none', cursor: 'pointer', fontFamily: 'inherit',
          borderTop: 'none', borderLeft: 'none', borderRight: 'none',
          borderBottom: tab === t.key ? '2px solid #818cf8' : '2px solid transparent',
          color: tab === t.key ? '#818cf8' : '#64748b',
          fontWeight: tab === t.key ? 700 : 400, position: 'relative',
        }}>
          {t.label}
          {t.badge > 0 && (
            <span style={{
              marginLeft: 4, background: '#ef4444', color: '#fff',
              fontSize: 10, padding: '1px 5px', borderRadius: 10, fontWeight: 700,
            }}>{t.badge}</span>
          )}
        </button>
      ))}
    </div>
  )
}
