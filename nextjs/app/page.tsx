export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px',
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖 Telegram Bot</h1>
      <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>Built with Next.js & Deployed on Vercel</p>
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem 2rem',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
      }}>
        <p style={{ margin: 0 }}>✅ Webhook endpoint: <code>/api/webhook</code></p>
      </div>
    </main>
  )
}

