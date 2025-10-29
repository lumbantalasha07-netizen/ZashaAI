import { Globe, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TemplateCardsProps {
  websiteCount: number;
  noWebsiteCount: number;
}

export function TemplateCards({ websiteCount, noWebsiteCount }: TemplateCardsProps) {
  const templates = [
    {
      name: "AI Automation for Existing Websites",
      description: "For businesses that already have a website",
      icon: Globe,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      count: websiteCount,
      sample: "Hi [FirstName], noticed [Company]'s site — quick idea to add AI automation that increases online orders and cuts staff time...",
      testId: "template-card-website",
    },
    {
      name: "Website + AI Package",
      description: "For businesses without a website",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      count: noWebsiteCount,
      sample: "Hi [FirstName], I scraped your profile — I can build a modern website for [Company] and add simple AI automations...",
      testId: "template-card-no-website",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {templates.map((template) => {
        const Icon = template.icon;
        return (
          <Card key={template.name} className="hover-elevate" data-testid={template.testId}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${template.bgColor} flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${template.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base leading-tight" data-testid={`${template.testId}-title`}>{template.name}</CardTitle>
                    <CardDescription className="text-xs mt-1" data-testid={`${template.testId}-description`}>
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="flex-shrink-0" data-testid={`${template.testId}-count`}>
                  {template.count} {template.count === 1 ? 'lead' : 'leads'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-md bg-muted/30 p-4 border">
                <p className="text-sm text-muted-foreground font-mono leading-relaxed line-clamp-3" data-testid={`${template.testId}-sample`}>
                  {template.sample}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
