import { useState } from 'react'

export default function ApiKeyModal({ onSave }) {
  const [key, setKey] = useState('')
  const [err, setErr] = useState('')

  const save = () => {
    const trimmed = key.trim()
    if (!trimmed.startsWith('sk-ant-')) {
      setErr('格式錯誤，API Key 應以 sk-ant- 開頭')
      return
    }
    onSave(trimmed)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#0f1628', border: '1px solid #1e2d4d',
        borderRadius: 14, padding: 28, width: 360, maxWidth: '90vw',
      }}>
        <div style={{ fontSize: 22, marginBottom: 6 }}>🔑</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0', marginBottom: 6 }}>
          設定 Anthropic API Key
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18, lineHeight: 1.6 }}>
          AI K線分析需要 Anthropic API Key。<br />
          前往{' '}
          <a href="https://console.anthropic.com/settings/keys" target="_blank"
            rel="noreferrer" style={{ color: '#818cf8' }}>
            console.anthropic.com
          </a>{' '}
          取得你的 Key。
        </div>

        <input
          type="password"
          placeholder="sk-ant-api03-..."
          value={key}
          onChange={e => { setKey(e.target.value); setErr('') }}
          onKeyDown={e => e.key === 'Enter' && save()}
          style={{
            width: '100%', padding: '10px 12px', fontSize: 13,
            background: '#151d35', border: `1px solid ${err ? '#ef4444' : '#1e2d4d'}`,
            borderRadius: 8, color: '#e2e8f0', outline: 'none',
            fontFamily: 'monospace', marginBottom: 8,
            boxSizing: 'border-box',
          }}
        />

        {err && (
          <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 10 }}>{err}</div>
        )}

        <div style={{ fontSize: 11, color: '#374151', marginBottom: 16 }}>
          🔒 Key 只存在記憶體，重新整理頁面後需重新輸入，不會上傳任何地方。
        </div>

        <button onClick={save} style={{
          width: '100%', padding: '10px', fontSize: 14, borderRadius: 8,
          background: '#1e2d4d', border: '1px solid #818cf8',
          color: '#818cf8', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
        }}>
          開始使用 🚀
        </button>
      </div>
    </div>
  )
}
