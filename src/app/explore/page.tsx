import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ExplorePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6 h-screen">
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            We&apos;re working on something exciting for you!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Our team is working hard to bring you an explore page. Stay tuned
            for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
