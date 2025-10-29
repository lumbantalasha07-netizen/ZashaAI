import { useState, useEffect } from "react";
import { X, Send, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

interface MessagePreviewModalProps {
  lead: Lead;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function MessagePreviewModal({ lead, open, onClose, onUpdate }: MessagePreviewModalProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [subject, setSubject] = useState(lead.subject || "");
  const [messageBody, setMessageBody] = useState(lead.messageBody || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSubject(lead.subject || "");
    setMessageBody(lead.messageBody || "");
    setIsEditing(false);
  }, [lead]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiRequest("PATCH", `/api/leads/${lead.id}`, {
        subject,
        messageBody,
      });
      toast({
        title: "Message Updated",
        description: "The message has been saved successfully.",
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save the message.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    try {
      await apiRequest("POST", `/api/leads/${lead.id}/send-test`, undefined);
      toast({
        title: "Test Email Sent",
        description: `A test email has been sent to ${lead.email}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Send Failed",
        description: "Failed to send test email.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-message-preview">
        <DialogHeader>
          <DialogTitle className="text-xl">Message Preview</DialogTitle>
          <DialogDescription>
            Review and edit the personalized message for {lead.firstName} {lead.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Lead Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground" data-testid="text-preview-lead-name">
                {lead.firstName} {lead.lastName}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-preview-lead-company">{lead.company}</p>
            </div>
            <div className="flex items-center gap-2">
              {lead.hasWebsite ? (
                <Badge variant="secondary" data-testid="badge-preview-has-website">Has Website</Badge>
              ) : (
                <Badge variant="outline" data-testid="badge-preview-no-website">No Website</Badge>
              )}
              {lead.email && <Badge variant="secondary" data-testid="badge-preview-email">{lead.email}</Badge>}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject Line
              </Label>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-mode"
                >
                  Edit Message
                </Button>
              )}
            </div>
            {isEditing ? (
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                data-testid="input-subject"
              />
            ) : (
              <div className="p-3 bg-muted/30 rounded-md border">
                <p className="text-sm font-medium text-foreground" data-testid="text-preview-subject">{subject || "No subject"}</p>
              </div>
            )}
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Message Body
            </Label>
            {isEditing ? (
              <Textarea
                id="message"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Email message"
                rows={10}
                className="font-mono text-sm"
                data-testid="textarea-message"
              />
            ) : (
              <div className="p-4 bg-muted/30 rounded-md border min-h-[200px]">
                <p className="text-sm text-foreground font-mono whitespace-pre-wrap" data-testid="text-preview-body">
                  {messageBody || "No message"}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSubject(lead.subject || "");
                  setMessageBody(lead.messageBody || "");
                }}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                data-testid="button-save-message"
              >
                {isSaving ? "Saving..." : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} data-testid="button-close-preview">
                Close
              </Button>
              {lead.email && (
                <Button
                  onClick={handleSendTest}
                  data-testid="button-send-test"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
