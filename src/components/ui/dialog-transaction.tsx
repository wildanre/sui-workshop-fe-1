"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  digest: string;
  title?: string;
  description?: string;
}

export function TransactionDialog({
  open,
  onOpenChange,
  digest,
  title = "Transaction Successful!",
  description = "Your transaction has been submitted to the network.",
}: TransactionDialogProps) {
  const suivisionUrl = `https://testnet.suivision.xyz/txblock/${digest}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-green-600">✅ {title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Transaction Digest:
            </p>
            <p className="text-xs font-mono break-all text-gray-600">
              {digest}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <a
              href={suivisionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button className="w-full" variant="default">
                View on SuiVision →
              </Button>
            </a>
            <Button
              className="w-full"
              variant="neutral"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
