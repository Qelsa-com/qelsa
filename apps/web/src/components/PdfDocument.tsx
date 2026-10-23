"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type PdfDocumentProps = {
  pdfUrl: string;
};

export default function PdfDocument({ pdfUrl }: PdfDocumentProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages: nextNumPages }: { numPages: number }) {
    setNumPages(nextNumPages);
  }

  return (
    <div style={{ width: "100%", height: "80vh" }}>
      <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
        <Page
          pageNumber={pageNumber}
          width={Math.min(800, typeof window === "undefined" ? 800 : window.innerWidth - 40)}
        />
      </Document>
      <p>
        Page {pageNumber} of {numPages ?? "—"}
      </p>
      <button type="button" onClick={() => setPageNumber(Math.max(pageNumber - 1, 1))}>
        Previous
      </button>
      <button type="button" onClick={() => setPageNumber(Math.min(pageNumber + 1, numPages || 1))}>
        Next
      </button>
    </div>
  );
}
