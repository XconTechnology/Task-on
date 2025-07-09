"use client";

import type React from "react";
import { useState } from "react";
import {
  Download,
  Share2,
  Mail,
  MessageCircle,
  Instagram,
  FileText,
  Calendar,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { exportApi } from "@/lib/api";

interface ExportButtonProps {
  userId: string;
  username: string;
  currentUserRole: string;
  onExport?: (timeframe: string, format: string) => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  userId,
  username,
  currentUserRole,
  onExport,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStep, setShareStep] = useState<"timeframe" | "platform">(
    "timeframe"
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("");

  // Check if user has permission to export
  const canExport = currentUserRole === "Owner" || currentUserRole === "Admin";

  if (!canExport) {
    return null;
  }

  const handleExport = async (timeframe: string) => {
    setIsExporting(true);
    try {
      // Use the exportApi function instead of direct fetch
      const result = await exportApi.exportUserData(userId, timeframe);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Export failed");
      }

      // The result.data should be the blob
      const blob = result.data as Blob;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${username}-report-${timeframe}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `${username}'s ${timeframe} report has been downloaded.`,
      });

      onExport?.(timeframe, "pdf");
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description:
          "There was an error generating the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareTimeframeSelect = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    setShareStep("platform");
  };

  const handleShare = async (platform: string) => {
    if (!selectedTimeframe) {
      toast({
        title: "No Timeframe Selected",
        description: "Please select a timeframe first.",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    try {
      // Generate the PDF for sharing
      const result = await exportApi.exportUserData(userId, selectedTimeframe);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Export failed");
      }

      const blob = result.data as Blob;
      const fileName = `${username}-report-${selectedTimeframe}-${new Date().toISOString().split("T")[0]}.pdf`;

      if (navigator.share && platform === "native") {
        const file = new File([blob], fileName, { type: "application/pdf" });
        await navigator.share({
          title: `${username}'s Performance Report`,
          text: `Performance report for ${username} (${selectedTimeframe})`,
          files: [file],
        });
      } else {
        // Fallback for specific platforms
        const url = window.URL.createObjectURL(blob);

        switch (platform) {
          case "email":
            const emailSubject = encodeURIComponent(
              `Performance Report - ${username}`
            );
            const emailBody = encodeURIComponent(
              `Please find attached the performance report for ${username} covering the ${selectedTimeframe} period.\n\nGenerated on: ${new Date().toLocaleDateString()}`
            );
            window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`);
            break;

          case "whatsapp":
            const whatsappText = encodeURIComponent(
              `Performance Report for ${username} (${selectedTimeframe}) - Generated on ${new Date().toLocaleDateString()}`
            );
            window.open(`https://wa.me/?text=${whatsappText}`);
            break;

          case "instagram":
            // Instagram doesn't support direct file sharing via URL, so we'll copy the link
            navigator.clipboard.writeText(url);
            toast({
              title: "Link Copied",
              description:
                "Report link copied to clipboard. You can share it on Instagram.",
            });
            break;

          default:
            // Generic share
            navigator.clipboard.writeText(url);
            toast({
              title: "Link Copied",
              description: "Report link copied to clipboard.",
            });
        }

        // Clean up URL after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      }

      // Close dialog and reset state
      setIsShareDialogOpen(false);
      setShareStep("timeframe");
      setSelectedTimeframe("");

      toast({
        title: "Shared Successfully",
        description: `Report shared via ${platform}.`,
      });
    } catch (error) {
      console.error("Share error:", error);
      toast({
        title: "Share Failed",
        description: "There was an error sharing the report.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const timeframeOptions = [
    { value: "week", label: "Last Week", icon: Calendar },
    { value: "month", label: "Last Month", icon: Calendar },
    { value: "year", label: "Last Year", icon: Clock },
    { value: "all", label: "All Time", icon: FileText },
  ];

  const handleShareDialogClose = () => {
    setIsShareDialogOpen(false);
    setShareStep("timeframe");
    setSelectedTimeframe("");
  };

  const handleBackToTimeframe = () => {
    setShareStep("timeframe");
    setSelectedTimeframe("");
  };

  const getTimeframeLabel = (value: string) => {
    const option = timeframeOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Export Dropdown - Unchanged */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export Report"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Select Time Period</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {timeframeOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleExport(option.value)}
                disabled={isExporting}
                className="cursor-pointer"
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {option.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share Dialog - Completely Redesigned */}
      <Dialog open={isShareDialogOpen} onOpenChange={handleShareDialogClose}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsShareDialogOpen(true)}
          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {shareStep === "platform" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToTimeframe}
                  className="p-1 h-6 w-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              Share Report
            </DialogTitle>
            <DialogDescription>
              {shareStep === "timeframe"
                ? `Select time period for ${username}'s report`
                : `Share ${username}'s report (${getTimeframeLabel(selectedTimeframe)})`}
            </DialogDescription>
          </DialogHeader>

          {shareStep === "timeframe" ? (
            // Step 1: Select Timeframe
            <div className="grid grid-cols-2 gap-4 py-4">
              {timeframeOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant="outline"
                    onClick={() => handleShareTimeframeSelect(option.value)}
                    className="flex flex-col items-center gap-2 h-20"
                    disabled={isSharing}
                  >
                    <IconComponent className="w-6 h-6 text-blue-600" />
                    <span className="text-sm">{option.label}</span>
                  </Button>
                );
              })}
            </div>
          ) : (
            // Step 2: Select Platform
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                variant="outline"
                onClick={() => handleShare("email")}
                className="flex flex-col items-center gap-2 h-20"
                disabled={isSharing}
              >
                <Mail className="w-6 h-6 text-blue-600" />
                <span className="text-sm">Email</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("whatsapp")}
                className="flex flex-col items-center gap-2 h-20"
                disabled={isSharing}
              >
                <MessageCircle className="w-6 h-6 text-green-600" />
                <span className="text-sm">WhatsApp</span>
              </Button>
              {/*
               <Button
                variant="outline"
                onClick={() => handleShare("instagram")}
                className="flex flex-col items-center gap-2 h-20"
                disabled={isSharing}
              >
                <Instagram className="w-6 h-6 text-pink-600" />
                <span className="text-sm">Instagram</span>
              </Button>
               */}
                <Button
                  variant="outline"
                  onClick={() => handleShare("native")}
                  className="flex flex-col items-center gap-2 h-20"
                  disabled={isSharing}
                >
                  <Share2 className="w-6 h-6 text-gray-600" />
                  <span className="text-sm">More</span>
                </Button>
            </div>
          )}

          {isSharing && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                Generating and sharing report...
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {canExport && (
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-700 text-xs"
        >
          Admin Access
        </Badge>
      )}
    </div>
  );
};

export default ExportButton;
