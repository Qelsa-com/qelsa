"use client";

import dynamic from "next/dynamic";

// Dynamic import with SSR disabled
const PdfViewer = dynamic(() => import("./PdfDocument"), { ssr: false, loading: () => <p>Loading PDF...</p> });

export default function PDFViewer({ pdfUrl }) {
  return <PdfViewer pdfUrl={pdfUrl} />;
}
