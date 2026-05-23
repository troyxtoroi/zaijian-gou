export default function Toast({ toast }) {
  if (!toast) return null
  const colors = {
    buy: { bg: '#0f2b1e', border: '#22c55e55' },
    err: { bg: '#2b0f0f', border: '#ef444455' },
    ok:  { bg: '#131d35', border: '#818cf855' },
  }
  const c = colors[toast.type] || colors.ok
  return (
    <div style={{
      position: 'absolute', top: 12, right: 12, zIndex: 99,
      padding: '9px 14px', borderRadius: 8, fontSize: 13,
      background: c.bg, border: `1px solid ${c.border}`,
      color: '#e2e8f0', maxWidth: 270,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      animation: 'fadeIn 0.2s ease',
    }}>
      {toast.msg}
    </div>
  )
}
