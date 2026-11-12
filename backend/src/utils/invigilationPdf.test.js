const test = require("node:test");
const assert = require("node:assert/strict");
const { createInvigilationPdf } = require("./invigilationPdf");

test("creates a downloadable PDF with the selected section arrangement", async () => {
  const pdf = await createInvigilationPdf(
    { fullName: "Faculty Member", employeeId: "EMP-1" },
    "section",
    [{
      building: "Building A",
      roomNumber: "R-1",
      allocatedStudents: 2,
      rows: [[
        { isEmpty: false, courseName: "BTECH (CSE) / Section C" },
        { isEmpty: false, courseName: "BTECH (CSE) / Section D" },
      ]],
    }]
  );

  assert.equal(pdf.subarray(0, 5).toString("ascii"), "%PDF-");
  assert.ok(pdf.includes(Buffer.from("%%EOF")));
});
