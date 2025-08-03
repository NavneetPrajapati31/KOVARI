import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/shared/components/ui/timeline";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

const items = [
  {
    id: 1,
    date: "Mar 15, 2024",
    title: "Project Kickoff",
    description:
      "Initial team meeting and project scope definition. Established key milestones and resource allocation.",
  },
  {
    id: 2,
    date: "Mar 22, 2024",
    title: "Design Phase",
    description:
      "Completed wireframes and user interface mockups. Stakeholder review and feedback incorporated.",
  },
  {
    id: 3,
    date: "Apr 5, 2024",
    title: "Development Sprint",
    description:
      "Backend API implementation and frontend component development in progress.",
  },
  {
    id: 4,
    date: "Apr 19, 2024",
    title: "Testing & Deployment",
    description:
      "Quality assurance testing, performance optimization, and production deployment preparation.",
  },
  // {
  //   id: 5,
  //   date: "Apr 19, 2024",
  //   title: "Testing & Deployment",
  //   description:
  //     "Quality assurance testing, performance optimization, and production deployment preparation.",
  // },
];

export default function Component() {
  return (
    <Card className="flex-1 p-4 border-none shadow-sm rounded-xl">
      <CardHeader className="px-1.5 gap-0.5">
        <CardTitle className="text-sm">Project Timeline</CardTitle>
        <p className="text-muted-foreground text-xs">
          Your travel companions await
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <Timeline defaultValue={3}>
          {items.map((item) => (
            <TimelineItem
              key={item.id}
              step={item.id}
              className="group-data-[orientation=vertical]/timeline:sm:ms-32 pb-12 last:pb-0"
            >
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate className="group-data-[orientation=vertical]/timeline:sm:absolute group-data-[orientation=vertical]/timeline:sm:-left-32 group-data-[orientation=vertical]/timeline:sm:w-20 group-data-[orientation=vertical]/timeline:sm:text-right">
                  {item.date}
                </TimelineDate>
                <TimelineTitle className="sm:-mt-0.5 !text-sm !font-medium">
                  {item.title}
                </TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent className="!text-xs">
                {item.description}
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
}
