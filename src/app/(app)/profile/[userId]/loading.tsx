import { CardContent } from "@/shared/components/ui/card";
import { Card, Skeleton } from "@heroui/react";

export default function Loading() {
  return (
    <>
      {/* Mobile/Tablet Layout */}
      <div className="min-h-screen bg-transparent md:hidden">
        <Card className="w-full h-full mx-auto bg-transparent border-none rounded-none gap-4 shadow-none p-3">
          {/* Profile Information Section */}
          <Card className="rounded-none border-none shadow-none bg-transparent p-0">
            <CardContent className="p-0">
              <div className="flex flex-row items-stretch gap-4">
                <Card className="flex rounded-3xl bg-transparent border border-border shadow-none p-4 items-start justify-start flex-1 min-w-0">
                  <div className="flex flex-row items-center gap-x-6 w-full mb-4 mt-3">
                    <div className="flex flex-row justify-start items-center flex-1 min-w-0 gap-x-4">
                      <div className="flex flex-col">
                        <Skeleton className="h-[70px] w-[70px] rounded-full" />
                      </div>
                      <div className="flex flex-col">
                        <Skeleton className="h-3 w-24 rounded-full mb-2" />
                        <Skeleton className="h-3 w-20 rounded-full mb-2" />
                      </div>
                    </div>
                  </div>

                  <Skeleton className="h-3 w-1/3 rounded-full mb-2" />
                  <Skeleton className="h-3 w-1/2 rounded-full mb-2" />
                  <Skeleton className="h-3 w-full rounded-full mb-2" />
                  <Skeleton className="h-3 w-full rounded-full mb-2" />
                  <Skeleton className="h-3 w-full rounded-full mb-2" />

                  <div className="flex flex-row justify-start items-center flex-1 gap-x-1.5 mt-4 w-full">
                    <Skeleton className="h-8 w-1/2 rounded-lg" />
                    <Skeleton className="h-8 w-1/2 rounded-lg" />
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card
            aria-label="User details"
            className="w-full h-full rounded-3xl bg-transparent shadow-none p-4 flex flex-col gap-6 border border-border mx-auto"
          >
            <Skeleton className="w-1/5 rounded-full h-3 mt-2 mb-1"></Skeleton>

            <Card className="rounded-none border-none shadow-none bg-transparent p-0">
              <CardContent className="p-0">
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 8 }).map((post, index) => (
                    <div
                      key={index}
                      className="aspect-[4/5] bg-muted rounded-none overflow-hidden flex items-center justify-center shadow-sm"
                    >
                      <Skeleton className="w-full h-full object-cover rounded-none"></Skeleton>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Card>
        </Card>
      </div>

      {/* Desktop Layout - Keep existing */}
      <div className="min-h-screen bg-transparent hidden md:block">
        <Card className="w-full h-full mx-auto bg-transparent border-none rounded-none gap-4 shadow-none p-5">
          {/* Profile Information Section */}
          <Card className="rounded-none border-none shadow-none bg-transparent p-0">
            <CardContent className="p-0">
              <div className="flex flex-row items-stretch gap-4">
                {/* Profile Avatar Overlay - Stretches to match second card height */}
                <Skeleton className="rounded-3xl w-[230px] h-[230px] min-[840px]:h-[210px] min-[840px]:w-[210px] flex-shrink-0"></Skeleton>

                <Card className="flex rounded-3xl bg-transparent border border-border h-[230px] min-[840px]:h-[210px] shadow-none p-6 py-5 items-start justify-start flex-1 min-w-0">
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
                <div className="grid grid-cols-3 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((post, index) => (
                    <div
                      key={index}
                      className="aspect-[4/5] bg-muted rounded-lg overflow-hidden flex items-center justify-center shadow-sm"
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
    </>
  );
}
