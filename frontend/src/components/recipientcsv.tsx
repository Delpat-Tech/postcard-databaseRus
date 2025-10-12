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

        XLSX.writeFile(workbook, fileName, { bookType: format });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON (works for CSV, XLS, XLSX)
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
            handleParsedData(rows);
        };

        reader.readAsArrayBuffer(file);
    };

    const handleParsedData = (rows: any[]) => {
        rows.forEach((row: any) => {
            const recipient = {
                id: uuidv4(),
                firstName: row["First Name"]?.trim() || "",
                lastName: row["Last Name"]?.trim() || "",
                company: row["Company"]?.trim() || undefined,
                externalReferenceNumber:
                    row["External Reference Number"]?.trim() || undefined,
                address1: row["Address1"]?.trim() || "",
                address2: row["Address2"]?.trim() || undefined,
                city: row["City"]?.trim() || "",
                state: row["State"]?.trim() || "",
                zipCode: row["Zip Code"]?.trim() || "",
            };
            addRecipient(recipient);
        });

        alert(`✅ Added ${rows.length} recipients from file`);
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
                1️⃣ Download the Excel or CSV template.<br />
                2️⃣ Fill in recipient details using the provided headers.<br />
                3️⃣ Save the file and upload it here.<br />
                <br />
                <strong>Headers must match exactly:</strong><br />
                First Name, Last Name, Company, External Reference Number, Address1,
                Address2, City, State, Zip Code
            </p>
        </div>
    );
}
