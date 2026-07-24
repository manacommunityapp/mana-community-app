import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { serviceRequestService } from "../../../services/servicePlatformService";
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ServiceRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: number;
  categoryName: string;
  onSuccess: () => void;
}

export function ServiceRequestDialog({
  open,
  onOpenChange,
  categoryId,
  categoryName,
  onSuccess,
}: ServiceRequestDialogProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("NORMAL");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setUrgency("NORMAL");
    setPreferredDate("");
    setPreferredTimeSlot("");
    setAddress("");
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      await serviceRequestService.create({
        categoryId,
        title: title.trim(),
        description: description.trim() || undefined,
        urgency,
        preferredDate: preferredDate || undefined,
        preferredTimeSlot: preferredTimeSlot || undefined,
        address: address || undefined,
        submitImmediately: true,
      });
      toast.success("Service request submitted!", {
        action: {
          label: "View Requests",
          onClick: () => navigate("/services/requests"),
        },
      });
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Service</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-slate-500">Category</Label>
            <p className="text-sm font-medium">{categoryName}</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="req-title">Title</Label>
            <Input
              id="req-title"
              placeholder="Brief summary of what you need"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="req-desc">Description</Label>
            <Textarea
              id="req-desc"
              placeholder="Describe the service you need in detail..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Urgency</Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="EMERGENCY">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="req-date">Preferred Date</Label>
              <Input
                id="req-date"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="req-time">Time Slot</Label>
              <Input
                id="req-time"
                placeholder="e.g. Morning, 2-4pm"
                value={preferredTimeSlot}
                onChange={(e) => setPreferredTimeSlot(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="req-address">Address</Label>
            <Input
              id="req-address"
              placeholder="Service location"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
