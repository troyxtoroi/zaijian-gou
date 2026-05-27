import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  componentDidCatch(e, info) { console.error('[ZG Error]', e, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding:30, textAlign:'center', fontFamily:'system-ui', color:'#e2e8f0', background:'#0b0f1e', minHeight:'100vh' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>系統發生錯誤</div>
          <div style={{ fontSize:13, color:'#94a3b8', marginBottom:20 }}>{this.state.error?.message}</div>
          <button onClick={() => { this.setState({error:null}); window.location.reload() }}
            style={{ padding:'10px 24px', fontSize:14, borderRadius:8, cursor:'pointer',
              background:'#1e2d4d', border:'1px solid #818cf8', color:'#818cf8', fontFamily:'inherit' }}>
            🔄 重新載入
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
