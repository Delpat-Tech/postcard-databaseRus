import * as XLSX from "xlsx";
import { useOrderStore } from "../store/orderStore";
import { v4 as uuidv4 } from "uuid";

export default function RecipientUpload() {
  const { addRecipient } = useOrderStore();

  const headers = [
    [
      "First Name",
      "Last Name",
      "Company",
      "External Reference Number",
      "Address1",
      "Address2",
      "City",
      "State",
      "Zip Code",
    ],
  ];

  // 🧾 Download a blank Excel template
  const handleDownloadTemplate = (format: "xlsx" | "csv") => {
    const worksheet = XLSX.utils.aoa_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Recipients Template");

    const fileName =
      format === "xlsx"
        ? "recipients_template.xlsx"
        : "recipients_template.csv";

    // For CSV, ensure no BOM is added
    const writeOptions =
      format === "csv"
        ? { bookType: format as any, FS: ",", RS: "\n" }
        : { bookType: format as any };

    XLSX.writeFile(workbook, fileName, writeOptions);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array", codepage: 65001 }); // UTF-8 with BOM handling
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON (works for CSV, XLS, XLSX)
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        raw: false,
      });

      // Debug: Log first row to check headers
      console.log(
        "Parsed CSV - First row keys:",
        rows[0] ? Object.keys(rows[0]) : "No rows"
      );

      handleParsedData(rows);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleParsedData = (rows: any[]) => {
    // Validate that file has data
    if (rows.length === 0) {
      alert(
        "❌ Your CSV file appears to be empty.\n\nPlease ensure the file contains recipient data and try again."
      );
      return;
    }

    const firstRow = rows[0];

    // Clean header keys (remove BOM and trim whitespace)
    const cleanRow: any = {};
    Object.keys(firstRow).forEach((key) => {
      // Remove BOM characters (UTF-8 BOM: \uFEFF) and trim
      const cleanKey = key.replace(/^\uFEFF/, "").trim();
      cleanRow[cleanKey] = firstRow[key];
    });

    // Validate required headers exist
    const requiredHeaders = [
      "First Name",
      "Last Name",
      "Address1",
      "City",
      "State",
      "Zip Code",
    ];
    const missingHeaders = requiredHeaders.filter(
      (header) => !(header in cleanRow)
    );

    if (missingHeaders.length > 0) {
      console.error("Available headers:", Object.keys(cleanRow));
      console.error("Missing headers:", missingHeaders);
      alert(
        `❌ CSV Format Error\n\nMissing required columns: ${missingHeaders.join(
          ", "
        )}\n\nYour file has: ${Object.keys(cleanRow).join(
          ", "
        )}\n\n💡 Tip: Download the CSV template below and use it to ensure correct formatting.`
      );
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;

    rows.forEach((row: any) => {
      // Clean BOM from all keys in this row
      const cleanedRow: any = {};
      Object.keys(row).forEach((key) => {
        const cleanKey = key.replace(/^\uFEFF/, "").trim();
        cleanedRow[cleanKey] = row[key];
      });

      const firstName = cleanedRow["First Name"]?.toString().trim() || "";
      const lastName = cleanedRow["Last Name"]?.toString().trim() || "";
      const address1 = cleanedRow["Address1"]?.toString().trim() || "";
      const city = cleanedRow["City"]?.toString().trim() || "";
      const state = cleanedRow["State"]?.toString().trim() || "";
      const zipCode = cleanedRow["Zip Code"]?.toString().trim() || "";

      // Validate required fields are not empty
      if (!firstName || !lastName || !address1 || !city || !state || !zipCode) {
        skippedCount++;
        console.warn("Skipping row with missing required fields:", cleanedRow);
        return;
      }

      const recipient = {
        id: uuidv4(),
        firstName,
        lastName,
        company: cleanedRow["Company"]?.toString().trim() || undefined,
        externalReferenceNumber:
          cleanedRow["External Reference Number"]?.toString().trim() ||
          undefined,
        address1,
        address2: cleanedRow["Address2"]?.toString().trim() || undefined,
        city,
        state,
        zipCode,
      };
      addRecipient(recipient);
      addedCount++;
    });

    if (addedCount === 0) {
      alert(
        "❌ Import Failed\n\nNo valid recipients found. All rows are missing required fields (First Name, Last Name, Address1, City, State, Zip Code).\n\n💡 Tip: Download the template below and ensure all required columns are filled in."
      );
    } else if (skippedCount > 0) {
      alert(
        `⚠️ Partial Import Complete\n\n✅ Successfully added: ${addedCount} recipients\n❌ Skipped: ${skippedCount} rows with missing data\n\nPlease review your CSV and fill in all required fields for skipped rows.`
      );
    } else {
      alert(`✅ Success! Added ${addedCount} recipients from your file.`);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-4">Upload Recipients File</h3>

      {/* File Upload */}
      <input
        type="file"
        accept=".csv, .xls, .xlsx"
        onChange={handleFileUpload}
        className="border rounded p-2 w-full"
      />

      {/* Download Template Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => handleDownloadTemplate("xlsx")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Download Excel Template
        </button>
        <button
          onClick={() => handleDownloadTemplate("csv")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Download CSV Template
        </button>
      </div>

      <p className="text-sm text-gray-500 mt-3">
        <strong>Steps:</strong> <br />
        1️⃣ Download the Excel or CSV template.
        <br />
        2️⃣ Fill in recipient details using the provided headers.
        <br />
        3️⃣ Save the file and upload it here.
        <br />
        <br />
        <strong>Headers must match exactly:</strong>
        <br />
        First Name, Last Name, Company, External Reference Number, Address1,
        Address2, City, State, Zip Code
      </p>
    </div>
  );
}
