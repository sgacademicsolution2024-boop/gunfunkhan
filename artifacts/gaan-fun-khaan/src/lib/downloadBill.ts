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
    allowTaint: false,
    logging: false,
    onclone: (documentClone) => {
      const clonedBill = documentClone.getElementById(elementId);
      clonedBill?.querySelectorAll("img").forEach((img) => {
        const replacement = documentClone.createElement("div");
        replacement.textContent = "LOGO";
        replacement.setAttribute(
          "style",
          "width:56px;height:56px;border:1px solid #e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#64748b;background:#f8fafc;",
        );
        img.replaceWith(replacement);
      });
    },
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const imageWidth = pageWidth - margin * 2;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;

  if (imageHeight <= pageHeight - margin * 2) {
    pdf.addImage(imgData, "PNG", margin, margin, imageWidth, imageHeight);
  } else {
    let remainingHeight = imageHeight;
    let position = margin;
    while (remainingHeight > 0) {
      pdf.addImage(imgData, "PNG", margin, position, imageWidth, imageHeight);
      remainingHeight -= pageHeight - margin * 2;
      position -= pageHeight - margin * 2;
      if (remainingHeight > 0) pdf.addPage();
    }
  }

  pdf.save(fileName);
}
