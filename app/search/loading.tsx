export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-alabaster-cream">
      {/* Search bar skeleton */}
      <div className="w-full bg-white border-b border-pebble-grey/10 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:max-w-lg h-12 bg-pebble-grey/20 rounded-full animate-pulse" />
            <div className="flex gap-4">
              <div className="h-9 w-32 bg-pebble-grey/20 rounded-full animate-pulse" />
              <div className="h-9 w-36 bg-pebble-grey/20 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="mt-6 flex gap-4 border-t border-pebble-grey/10 pt-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-9 w-32 bg-pebble-grey/20 rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Results skeleton */}
      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="flex justify-between items-end mb-8">
          <div className="h-9 w-64 bg-pebble-grey/20 rounded-lg animate-pulse" />
          <div className="h-9 w-40 bg-pebble-grey/20 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl overflow-hidden border border-pebble-grey/20"
            >
              <div className="aspect-[4/3] bg-pebble-grey/20 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-6 w-3/4 bg-pebble-grey/20 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-pebble-grey/20 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-pebble-grey/20 rounded animate-pulse" />
                <div className="h-px bg-pebble-grey/20 mt-3" />
                <div className="h-6 w-1/3 bg-pebble-grey/20 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
