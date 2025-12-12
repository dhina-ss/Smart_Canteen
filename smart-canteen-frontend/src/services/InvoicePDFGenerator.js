// InvoicePDFGenerator.js - Fixed version
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (invoiceData) => {
  const doc = new jsPDF();
  
  // Add logo or header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoiceData.invoice_number}`, 20, 35);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
  doc.text(`Customer: ${invoiceData.customer_name}`, 20, 45);
  doc.text(`Phone: ${invoiceData.customer_phone}`, 20, 50);
  
  // Add items table
  const tableColumn = ["Item", "Quantity", "Unit Price", "Total"];
  const tableRows = [];
  
  invoiceData.items.forEach(item => {
    // Make sure itemName exists
    const itemName = item.itemName || `Item ${item.itemId}`;
    const unitPrice = item.unitPrice || 0;
    const quantity = item.quantity || 0;
    
    const itemData = [
      itemName,
      quantity.toString(),
      `₹${unitPrice.toFixed(2)}`,
      `₹${(quantity * unitPrice).toFixed(2)}`
    ];
    tableRows.push(itemData);
  });
  
  // Use autoTable correctly
  autoTable(doc, {
    startY: 60,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  // Add total
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Total Amount: ₹${invoiceData.total_amount}`, 150, finalY);
  
  // Add notes if any
  if (invoiceData.notes) {
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text('Notes:', 20, finalY + 15);
    // Split notes into multiple lines if too long
    const splitNotes = doc.splitTextToSize(invoiceData.notes, 180);
    doc.text(splitNotes, 20, finalY + 25);
  }
  
  // Add footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', 105, doc.internal.pageSize.height - 10, { align: 'center' });
  
  // Save the PDF
  doc.save(`invoice_${invoiceData.invoice_number}.pdf`);
};