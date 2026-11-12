const PDFDocument = require("pdfkit");

function createInvigilationPdf(faculty, mode, rooms) {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 48 });
    const chunks = [];

    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document
      .font("Helvetica-Bold")
      .fontSize(19)
      .fillColor("#0f172a")
      .text("SeatWise - Invigilation Plan");
    document.moveDown(0.6);
    document.font("Helvetica").fontSize(10).fillColor("#334155");
    document.text(`Faculty: ${faculty.fullName}`);
    document.text(`Employee ID: ${faculty.employeeId}`);
    document.text(`Arrangement: ${mode === "section" ? "Course and section" : "Course"}`);
    document.text(`Generated: ${new Date().toISOString().slice(0, 10)}`);
    document.moveDown(1);

    rooms.forEach((room, index) => {
      if (document.y > document.page.height - document.page.margins.bottom - 100) {
        document.addPage();
      }

      const groups = [...new Set(
        room.rows
          .flat()
          .filter((seat) => !seat.isEmpty && seat.courseName)
          .map((seat) => seat.courseName)
      )].sort((a, b) => a.localeCompare(b));

      document
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#1d4ed8")
        .text(`${index + 1}. ${room.building} - Room ${room.roomNumber}`);
      document.font("Helvetica").fontSize(10).fillColor("#334155");
      document.text(`Students assigned: ${room.allocatedStudents}`);
      document.text(mode === "section" ? "Courses / sections:" : "Courses:");
      for (const group of groups) {
        document.text(`- ${group}`, { indent: 12 });
      }
      document.moveDown(0.8);
    });

    document.end();
  });
}

module.exports = { createInvigilationPdf };
