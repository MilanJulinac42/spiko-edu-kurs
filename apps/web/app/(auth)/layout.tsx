export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#11151a',
          border: '1px solid #1f2630',
          borderRadius: 12,
          padding: '2rem',
        }}
      >
        {children}
      </div>
    </main>
  )
}
