import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="text-right">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white shadow-sm border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3 w-full">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="bg-white shadow-sm border-none">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
              {i === 1 && (
                <div className="flex flex-wrap gap-4 mt-4 justify-center">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-2">
                      <Skeleton className="w-3 h-3 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Trend Skeleton */}
      <Card className="bg-white shadow-sm border-none">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>

      {/* Time Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card
            key={i}
            className="bg-gradient-to-r from-gray-200 to-gray-300 shadow-lg border-none overflow-hidden animate-pulse"
          >
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16 bg-white/40" />
                  <Skeleton className="h-7 w-24 bg-white/40" />
                  <Skeleton className="h-4 w-32 bg-white/40" />
                </div>
                <Skeleton className="w-14 h-14 rounded-lg bg-white/40" />
              </div>
              <div className="mt-4 flex items-center space-x-1">
                <Skeleton className="h-4 w-4 rounded-full bg-white/40" />
                <Skeleton className="h-3 w-24 bg-white/40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardSkeleton