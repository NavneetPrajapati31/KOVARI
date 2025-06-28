import { CardContent } from "@/shared/components/ui/card";
import { Card, Skeleton } from "@heroui/react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-transparent">
      <Card className="w-full h-full mx-auto bg-transparent border-none rounded-none gap-4 shadow-none p-5">
        {/* Profile Information Section */}
        <Card className="rounded-none border-none shadow-none bg-transparent p-0">
          <CardContent className="p-0">
            <div className="flex flex-row items-stretch gap-4">
              {/* Profile Avatar Overlay - Stretches to match second card height */}
              <Skeleton className="rounded-3xl h-[230px] w-[230px] flex-shrink-0"></Skeleton>

              <Card className="flex rounded-3xl bg-transparent border border-border h-[230px] shadow-none p-6 py-5 items-start justify-start flex-1 min-w-0">
                <Skeleton className="h-4 w-1/5 rounded-full mb-2 mt-6" />
                <Skeleton className="h-4 w-1/6 rounded-full mb-5" />
                <Skeleton className="h-4 w-full rounded-full mb-2" />
                <Skeleton className="h-4 w-full rounded-full mb-2" />
                <Skeleton className="h-4 w-full rounded-full mb-2" />
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card
          aria-label="User details"
          className="w-full h-full rounded-3xl bg-transparent shadow-none p-6 flex flex-col gap-6 border border-border mx-auto"
        >
          <Skeleton className="w-1/6 rounded-full h-4 mt-2 mb-1"></Skeleton>

          <Card className="rounded-none border-none shadow-none bg-transparent p-0">
            <CardContent className="p-0">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((post, index) => (
                  <div
                    key={index}
                    className="aspect-[4/5] bg-muted rounded-3xl overflow-hidden flex items-center justify-center shadow-sm"
                  >
                    <Skeleton className="w-full h-full object-cover"></Skeleton>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Card>
      </Card>
    </div>
  );
}
