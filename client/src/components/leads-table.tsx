import { useState } from "react";
import { Eye, Edit2, Trash2, Mail, Globe, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

interface LeadsTableProps {
  leads: Lead[];
  onPreview: (lead: Lead) => void;
  onUpdate: () => void;
}

export function LeadsTable({ leads, onPreview, onUpdate }: LeadsTableProps) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");

  const handleEditStart = (lead: Lead) => {
    setEditingId(lead.id);
    setEditEmail(lead.email || "");
  };

  const handleEditSave = async (leadId: string) => {
    try {
      await apiRequest("PATCH", `/api/leads/${leadId}`, { email: editEmail });
      toast({
        title: "Email Updated",
        description: "The email address has been updated successfully.",
      });
      setEditingId(null);
      onUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update email address.",
      });
    }
  };

  const handleDelete = async (leadId: string) => {
    try {
      await apiRequest("DELETE", `/api/leads/${leadId}`, undefined);
      toast({
        title: "Lead Deleted",
        description: "The lead has been removed.",
      });
      onUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete lead.",
      });
    }
  };

  const getStatusBadge = (lead: Lead) => {
    switch (lead.sendStatus) {
      case "sent":
        return (
          <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700" data-testid={`badge-status-${lead.id}`}>
            <CheckCircle2 className="h-3 w-3" />
            Sent
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1" data-testid={`badge-status-${lead.id}`}>
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case "sending":
        return (
          <Badge variant="secondary" className="gap-1" data-testid={`badge-status-${lead.id}`}>
            <Loader2 className="h-3 w-3 animate-spin" />
            Sending
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1" data-testid={`badge-status-${lead.id}`}>
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p data-testid="text-no-leads">No leads yet. Upload a CSV file to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold w-[200px]">Name</TableHead>
              <TableHead className="font-semibold w-[180px]">Company</TableHead>
              <TableHead className="font-semibold w-[240px]">Email</TableHead>
              <TableHead className="font-semibold w-[100px]">Type</TableHead>
              <TableHead className="font-semibold w-[120px]">Status</TableHead>
              <TableHead className="font-semibold w-[400px]">Message Preview</TableHead>
              <TableHead className="font-semibold text-right w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead, index) => (
              <TableRow
                key={lead.id}
                className="hover-elevate"
                data-testid={`row-lead-${lead.id}`}
              >
                <TableCell className="font-medium">
                  <div>
                    <p className="text-sm text-foreground" data-testid={`text-name-${lead.id}`}>
                      {lead.firstName} {lead.lastName}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-foreground truncate" data-testid={`text-company-${lead.id}`}>{lead.company || "—"}</p>
                </TableCell>
                <TableCell>
                  {editingId === lead.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="h-8 text-sm"
                        placeholder="email@example.com"
                        data-testid={`input-edit-email-${lead.id}`}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSave(lead.id)}
                        data-testid={`button-save-email-${lead.id}`}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {lead.email ? (
                        <>
                          <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-foreground truncate" data-testid={`text-email-${lead.id}`}>{lead.email}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground" data-testid={`text-no-email-${lead.id}`}>No email</p>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {lead.hasWebsite ? (
                    <Badge variant="secondary" className="gap-1" data-testid={`badge-type-${lead.id}`}>
                      <Globe className="h-3 w-3" />
                      Has Site
                    </Badge>
                  ) : (
                    <Badge variant="outline" data-testid={`badge-type-${lead.id}`}>No Site</Badge>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(lead)}</TableCell>
                <TableCell>
                  {lead.subject ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground truncate" data-testid={`text-subject-${lead.id}`}>
                        {lead.subject}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`text-preview-${lead.id}`}>
                        {lead.messageBody}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground" data-testid={`text-no-message-${lead.id}`}>Not generated</p>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPreview(lead)}
                      data-testid={`button-preview-${lead.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditStart(lead)}
                      data-testid={`button-edit-${lead.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(lead.id)}
                      data-testid={`button-delete-${lead.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
