import { useState } from "react";
import { AlertTriangle, Send, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ConfirmSendModalProps {
  open: boolean;
  onClose: () => void;
  totalCount: number;
  websiteCount: number;
  noWebsiteCount: number;
  onConfirm: () => void;
}

export function ConfirmSendModal({
  open,
  onClose,
  totalCount,
  websiteCount,
  noWebsiteCount,
  onConfirm,
}: ConfirmSendModalProps) {
  const { toast } = useToast();
  const [confirmed, setConfirmed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sendComplete, setSendComplete] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const handleConfirm = async () => {
    if (!confirmed) {
      toast({
        variant: "destructive",
        title: "Confirmation Required",
        description: "Please confirm that you've reviewed the message templates.",
      });
      return;
    }

    setIsSending(true);
    setProgress(0);
    setSentCount(0);

    try {
      // Start sending in background
      fetch("/api/leads/send-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ throttlePerSecond: 2 }),
      }).catch((error) => {
        console.error("Bulk send error:", error);
      });

      // Poll for status updates
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch("/api/leads");
          if (response.ok) {
            const allLeads = await response.json();
            const sent = allLeads.filter((l: any) => l.sendStatus === "sent").length;
            const sending = allLeads.filter((l: any) => l.sendStatus === "sending").length;
            const failed = allLeads.filter((l: any) => l.sendStatus === "failed").length;
            
            setSentCount(sent + failed);
            const progressPercent = totalCount > 0 ? Math.round(((sent + failed) / totalCount) * 100) : 0;
            setProgress(progressPercent);

            // Check if complete
            if (sent + failed >= totalCount || (sent + failed > 0 && sending === 0)) {
              clearInterval(pollInterval);
              setProgress(100);
              setSendComplete(true);

              setTimeout(() => {
                setIsSending(false);
                toast({
                  title: "Emails Sent",
                  description: `Successfully sent ${sent} emails${failed > 0 ? `, ${failed} failed` : ""}.`,
                });
                onConfirm();
                handleClose();
              }, 1500);
            }
          }
        } catch (error) {
          console.error("Poll error:", error);
        }
      }, 1000); // Poll every second

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (!sendComplete) {
          toast({
            variant: "destructive",
            title: "Send Timeout",
            description: "The send operation timed out. Check individual lead statuses.",
          });
          setIsSending(false);
        }
      }, 300000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Send Failed",
        description: error instanceof Error ? error.message : "Failed to send emails.",
      });
      setIsSending(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setConfirmed(false);
      setProgress(0);
      setSendComplete(false);
      setSentCount(0);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="modal-confirm-send">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {sendComplete ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            )}
            <div>
              <DialogTitle className="text-xl">
                {sendComplete ? "Emails Sent!" : "Confirm Bulk Send"}
              </DialogTitle>
              <DialogDescription>
                {sendComplete
                  ? "All emails have been sent successfully"
                  : "This action cannot be undone"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!sendComplete && !isSending && (
          <div className="space-y-4 py-4">
            {/* Email Breakdown */}
            <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Total Emails</span>
                <span className="text-lg font-bold text-foreground" data-testid="text-total-count">{totalCount}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">With websites</span>
                  <span className="font-medium text-foreground" data-testid="text-website-count">{websiteCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Without websites</span>
                  <span className="font-medium text-foreground" data-testid="text-no-website-count">{noWebsiteCount}</span>
                </div>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                data-testid="checkbox-confirm"
              />
              <Label
                htmlFor="confirm"
                className="text-sm font-medium cursor-pointer leading-tight"
              >
                I've reviewed the message templates and confirmed all email addresses are correct
              </Label>
            </div>
          </div>
        )}

        {isSending && (
          <div className="space-y-4 py-6">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm font-medium text-foreground">Sending emails...</p>
              <p className="text-xs text-muted-foreground" data-testid="text-send-progress">
                {sentCount} of {totalCount} processed
              </p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {sendComplete && (
          <div className="py-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Your emails are on their way!
            </p>
          </div>
        )}

        {!sendComplete && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
              data-testid="button-cancel-send"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!confirmed || isSending}
              data-testid="button-confirm-send"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send {totalCount} Emails
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
