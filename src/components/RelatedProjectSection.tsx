import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RelatedProject = {
  slug: string;
  summary: string;
  title: string;
} | null;

export function RelatedProjectSection({ relatedProject }: { relatedProject: RelatedProject }) {
  if (!relatedProject) {
    return null;
  }

  return (
    <section className="mb-8">
      <Card className="gap-4 border-border/70 bg-muted/20 py-5">
        <CardHeader className="gap-3 pb-0">
          <Badge variant="outline" className="w-fit font-normal">
            相關案例
          </Badge>
          <div className="space-y-2">
            <CardTitle className="text-base font-medium leading-snug">
              <Link href={`/projects/${relatedProject.slug}`} className="hover:underline">
                {relatedProject.title}
              </Link>
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">{relatedProject.summary}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Link
            href={`/projects/${relatedProject.slug}`}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            查看案例
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
