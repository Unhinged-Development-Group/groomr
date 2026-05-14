export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-alabaster-cream flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-groomr-gold border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-fredoka text-xl text-deep-slate">Loading your dashboard…</p>
      </div>
    </div>
  );
}
