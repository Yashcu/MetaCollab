import { Skeleton } from "./ui/skeleton";
import { Card, CardHeader, CardContent } from "./ui/card";

const SkeletonCard = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-1/4" />
      </CardContent>
    </Card>
  );
};

export default SkeletonCard;
