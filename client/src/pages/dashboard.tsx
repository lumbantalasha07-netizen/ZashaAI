import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Upload, Send, Eye, Edit2, Trash2, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CsvUploadZone } from "@/components/csv-upload-zone";
import { LeadsTable } from "@/components/leads-table";
import { MessagePreviewModal } from "@/components/message-preview-modal";
import { ConfirmSendModal } from "@/components/confirm-send-modal";
import { StatsCards } from "@/components/stats-cards";
import { TemplateCards } from "@/components/template-cards";
import type { Lead } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isFindingEmails, setIsFindingEmails] = useState(false);

  // Fetch all leads
  const { data: leads = [], refetch: refetchLeads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const handleUploadComplete = () => {
    refetchLeads();
    toast({
      title: "Upload Successful",
      description: "Your leads have been uploaded and processed.",
    });
  };

  const handlePreviewClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowPreview(true);
  };

  const handleSendAll = () => {
    setShowConfirm(true);
  };

  const handleFindEmails = async () => {
    setIsFindingEmails(true);
    try {
      const response = await fetch("/api/leads/find-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Email Search Complete",
          description: `Found ${data.successCount} emails. ${data.failCount} failed, ${data.skippedCount} skipped.`,
        });
        refetchLeads();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to find emails",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsFindingEmails(false);
    }
  };

  const leadsWithEmail = leads.filter(l => l.email || l.foundEmail);
  const leadsWithWebsite = leadsWithEmail.filter(l => l.hasWebsite);
  const leadsWithoutWebsite = leadsWithEmail.filter(l => !l.hasWebsite);
  const pendingLeads = leads.filter(l => l.enrichmentStatus === "pending");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">
                  Zasha Outreach Automator
                </h1>
                <p className="text-xs text-muted-foreground">AI-Powered Email Campaigns</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {leads.length > 0 && (
                <Badge variant="secondary" data-testid="badge-total-leads">
                  {leads.length} {leads.length === 1 ? 'Lead' : 'Leads'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="text-sm text-muted-foreground" data-testid="text-loading">Loading leads...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
          {/* Stats Cards */}
          {leads.length > 0 && <StatsCards leads={leads} />}

          {/* Step 1: Upload CSV */}
          <Card data-testid="card-upload-section">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-sm font-semibold">1</span>
                </div>
                <div>
                  <CardTitle className="text-xl">Upload Leads</CardTitle>
                  <CardDescription>
                    Upload a CSV file with your leads (first_name, last_name, company, website, domain, has_website, profile_url, email)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CsvUploadZone onUploadComplete={handleUploadComplete} />
            </CardContent>
          </Card>

          {/* Step 2: Find Emails */}
          {leads.length > 0 && (
            <Card data-testid="card-find-emails-section">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl">Find & Verify Emails</CardTitle>
                    <CardDescription>
                      Automatically find and verify email addresses for your leads using Mailboxlayer
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-6 bg-muted/30 rounded-lg border">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {pendingLeads.length} {pendingLeads.length === 1 ? 'lead needs' : 'leads need'} email verification
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {leadsWithEmail.length} emails already found • {leads.length - leadsWithEmail.length - pendingLeads.length} failed/skipped
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    onClick={handleFindEmails}
                    disabled={pendingLeads.length === 0 || isFindingEmails}
                    data-testid="button-find-emails"
                    className="gap-2"
                  >
                    {isFindingEmails ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                        Finding Emails...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Find Emails
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Message Templates */}
          {leads.length > 0 && (
            <Card data-testid="card-templates-section">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl">Message Templates</CardTitle>
                    <CardDescription>
                      Two personalized templates are automatically generated based on whether the lead has a website
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TemplateCards 
                  websiteCount={leadsWithWebsite.length}
                  noWebsiteCount={leadsWithoutWebsite.length}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review Leads */}
          {leads.length > 0 && (
            <Card data-testid="card-leads-table-section">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="text-sm font-semibold">4</span>
                    </div>
                    <div>
                      <CardTitle className="text-xl">Review & Edit Leads</CardTitle>
                      <CardDescription>
                        Review your leads, preview messages, and make any necessary edits
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <LeadsTable 
                  leads={leads} 
                  onPreview={handlePreviewClick}
                  onUpdate={refetchLeads}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 5: Send Emails */}
          {leadsWithEmail.length > 0 && (
            <Card data-testid="card-send-section">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="text-sm font-semibold">5</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl">Send Campaigns</CardTitle>
                    <CardDescription>
                      Ready to send? Review your leads one more time before sending all emails
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-6 bg-muted/30 rounded-lg border">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {leadsWithEmail.length} {leadsWithEmail.length === 1 ? 'email' : 'emails'} ready to send
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {leadsWithWebsite.length} with websites • {leadsWithoutWebsite.length} without websites
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    onClick={handleSendAll}
                    data-testid="button-send-all"
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send All Emails
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-muted-foreground" data-testid="text-footer">
            Built by <span className="font-semibold text-foreground">Zasha</span>
          </p>
        </div>
      </footer>

      {/* Modals */}
      {selectedLead && (
        <MessagePreviewModal
          lead={selectedLead}
          open={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedLead(null);
          }}
          onUpdate={refetchLeads}
        />
      )}

      <ConfirmSendModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        totalCount={leadsWithEmail.length}
        websiteCount={leadsWithWebsite.length}
        noWebsiteCount={leadsWithoutWebsite.length}
        onConfirm={() => {
          setShowConfirm(false);
          refetchLeads();
        }}
      />
    </div>
  );
}
