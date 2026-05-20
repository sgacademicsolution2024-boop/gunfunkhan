import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function downloadBillPdf(elementId: string, fileName: string): Promise<void> {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error("Bill preview is not ready for PDF export.");
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(fileName);
}
