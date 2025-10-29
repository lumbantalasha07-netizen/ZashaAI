import { Users, Mail, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Lead } from "@shared/schema";

interface StatsCardsProps {
  leads: Lead[];
}

export function StatsCards({ leads }: StatsCardsProps) {
  const totalLeads = leads.length;
  const leadsWithEmail = leads.filter(l => l.email).length;
  const emailPercentage = totalLeads > 0 ? Math.round((leadsWithEmail / totalLeads) * 100) : 0;
  const sentSuccessfully = leads.filter(l => l.sendStatus === "sent").length;
  const failed = leads.filter(l => l.sendStatus === "failed").length;
  const pending = leads.filter(l => l.sendStatus === "pending" || l.sendStatus === "sending").length;

  const stats = [
    {
      label: "Total Leads",
      value: totalLeads,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      testId: "stat-total-leads",
    },
    {
      label: "Emails Found",
      value: leadsWithEmail,
      subtitle: `${emailPercentage}% of total`,
      icon: Mail,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      testId: "stat-emails-found",
    },
    {
      label: "Sent Successfully",
      value: sentSuccessfully,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      testId: "stat-sent-success",
    },
    {
      label: "Failed",
      value: failed,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      testId: "stat-failed",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-cards-container">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="hover-elevate" data-testid={stat.testId}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
