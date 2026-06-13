import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("shimmer-bg rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
