"use client";

import React, { useRef, useState } from "react";
import { ScanLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

const ReceiptUpload = ({ onScanned }) => {
  const inputRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const imageBase64 = await fileToBase64(file);

      const res = await fetch("/api/receipt-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: file.type }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");

      onScanned(data);
      toast.success("Receipt scanned — review the prefilled fields");
    } catch (err) {
      toast.error(err.message || "Could not scan receipt");
    } finally {
      setIsScanning(false);
      e.target.value = ""; // allow re-uploading the same file
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isScanning}
        onClick={() => inputRef.current?.click()}
      >
        {isScanning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Scanning receipt...
          </>
        ) : (
          <>
            <ScanLine className="mr-2 h-4 w-4" />
            Scan a receipt
          </>
        )}
      </Button>
    </div>
  );
};

export default ReceiptUpload;
