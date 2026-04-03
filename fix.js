const fs = require('fs');
let code = fs.readFileSync('src/app/chat/page.tsx', 'utf8');

const earlyReturns = `  // Auth check - redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn && isMounted) {
      router.push('/sign-in?redirect_url=/chat')
    }
  }, [isLoaded, isSignedIn, isMounted, router])`;

code = code.replace(earlyReturns, '');

const renderLogic = `
  // Auth check - redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn && isMounted) {
      router.push('/sign-in?redirect_url=/chat')
    }
  }, [isLoaded, isSignedIn, isMounted, router])

  if (!isMounted || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-[100dvh] bg-[#0a0a0f] flex items-center justify-center w-full">
        <div className="text-center p-8 bg-white/5 border border-white/10 rounded-[2rem] max-w-sm backdrop-blur-2xl">
          <h2 className="text-xl font-black text-white mb-2 tracking-tight">Access Denied</h2>
          <p className="text-white/60 text-sm mb-6">Please authenticate your identity to access Sarah Matrix.</p>
          <button 
            onClick={() => router.push('/sign-in?redirect_url=/chat')}
            className="w-full px-6 py-3 bg-violet-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-violet-600/20"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (`;

code = code.replace('  return (\n    <div className="flex h-[100dvh] w-screen bg-[#030308]', renderLogic + '\n    <div className="flex h-[100dvh] w-screen bg-[#030308]');

// Also fix the isMounted hydration issue
code = code.replace(
  "  const [isMounted, setIsMounted] = useState(false)",
  "  const [isMounted, setIsMounted] = useState(false)\n\n  useEffect(() => {\n    setIsMounted(true)\n  }, [])"
);

// Fix the desktop/mobile sidebar toggle for hydration safe
const resizeLogic = `  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])`;

const newResizeLogic = `  useEffect(() => {
    if (!isMounted) return
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMounted])`;

code = code.replace(resizeLogic, newResizeLogic);

fs.writeFileSync('src/app/chat/page.tsx', code);
console.log('Fixed ChatPage Hydration and Early Returns');
