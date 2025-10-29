import { useCallback, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CsvUploadZoneProps {
  onUploadComplete: () => void;
}

export function CsvUploadZone({ onUploadComplete }: CsvUploadZoneProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      // Accept various CSV MIME types and file extensions
      const isCSV = file.name.endsWith(".csv") || 
                    file.type === "text/csv" || 
                    file.type === "application/vnd.ms-excel" ||
                    file.type === "text/plain";
      
      if (isCSV) {
        setFile(file);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a CSV file (.csv extension).",
        });
      }
    }
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("Uploading CSV file:", file.name, "Size:", file.size, "Type:", file.type);
      setUploadProgress(30);

      const response = await fetch("/api/leads/upload", {
        method: "POST",
        body: formData,
      });

      console.log("Upload response status:", response.status);
      setUploadProgress(80);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }));
        console.error("Upload error:", errorData);
        throw new Error(errorData.error || errorData.details || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Upload successful:", data);

      setUploadProgress(100);

      // Invalidate the leads query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ["/api/leads"] });

      toast({
        title: "Upload Successful",
        description: `${data.leadsCount} leads uploaded and processed.`,
      });

      // Reset state
      setFile(null);
      setUploadProgress(0);
      onUploadComplete();
    } catch (error) {
      console.error("Upload error caught:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload CSV file.",
      });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
          ${isUploading ? "pointer-events-none opacity-50" : ""}
        `}
        data-testid="dropzone-csv-upload"
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-file-input"
          disabled={isUploading}
          data-testid="input-csv-file"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">
              {file ? (
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </span>
              ) : (
                "Drop your CSV file here"
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              or{" "}
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer font-medium text-primary hover:underline"
                data-testid="label-browse-files"
              >
                browse files
              </label>
            </p>
          </div>

          <p className="text-xs text-muted-foreground max-w-md" data-testid="text-csv-format">
            CSV should include: first_name, last_name, company, website, domain, has_website, profile_url, email (optional)
          </p>
        </div>
      </div>

      {/* File Actions */}
      {file && !isUploading && (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground" data-testid="text-file-name">{file.name}</p>
              <p className="text-xs text-muted-foreground" data-testid="text-file-size">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFile(null)}
              data-testid="button-remove-file"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleUpload}
              size="sm"
              data-testid="button-upload-csv"
            >
              Upload & Process
            </Button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground" data-testid="text-processing">Processing CSV...</span>
            <span className="font-medium text-foreground" data-testid="text-progress-percent">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" data-testid="progress-upload" />
        </div>
      )}
    </div>
  );
}
