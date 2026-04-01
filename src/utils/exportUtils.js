import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Captures a DOM element and exports it as a formatted PDF report.
 * @param {string} elementId ID of the DOM element to capture
 * @param {string} title Report Title
 * @param {string} filename Output PDF filename
 */
export async function exportToPDF(elementId, title, filename) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element ${elementId} not found for export.`);
    return;
  }

  try {
    // 1. Capture the DOM element as a high-res image
    const canvas = await html2canvas(element, {
      scale: 2, // 2x device pixel ratio for better fidelity
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff' // Force white background for the PDF
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // 2. Initialize PDF (A4 Portrait)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    
    // 3. Add Header
    pdf.setFillColor(248, 249, 250); // Light gray header bg
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(33, 37, 41);
    pdf.text("CHAINQUERY INTELLIGENCE", margin, 12);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(108, 117, 125);
    pdf.text(title, margin, 18);
    
    const dateStr = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
    pdf.text(dateStr, pageWidth - margin, 18, { align: 'right' });

    // 4. Calculate Image Dimensions to fit page
    const contentWidth = pageWidth - (margin * 2);
    // Calculate aspect ratio
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = imgProps.height / imgProps.width;
    const contentHeight = contentWidth * ratio;

    let yOffset = 35;

    // Check if the image fits on one page
    if (yOffset + contentHeight <= pageHeight - margin) {
      // Fits on one page
      pdf.addImage(imgData, 'JPEG', margin, yOffset, contentWidth, contentHeight);
    } else {
      // Needs pagination
      let remainingHeight = contentHeight;
      let currentY = 0; // Where we are in the original image

      while (remainingHeight > 0) {
        // Calculate how much we can fit on this page
        const availableSpace = pageHeight - yOffset - margin;
        const pageRatio = availableSpace / contentHeight; // Ratio of current page space to total content height
        
        // This is tricky with simple addImage mapping, better to scale the whole thing across pages 
        // by displacing the Y coordinate negatively.
        pdf.addImage(imgData, 'JPEG', margin, yOffset - currentY, contentWidth, contentHeight);
        
        remainingHeight -= availableSpace;
        currentY += availableSpace;
        
        if (remainingHeight > 0) {
          pdf.addPage();
          yOffset = 20; // reset yOffset for new page
          
          // Add simple header to subsequent pages
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`${title} - Continued`, margin, 10);
          pdf.text(dateStr, pageWidth - margin, 10, { align: 'right' });
        }
      }
    }

    // 5. Add Footer
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Confidential & Proprietary - Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // 6. Download
    pdf.save(filename);

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  }
}
