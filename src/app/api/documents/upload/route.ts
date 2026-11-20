import { NextRequest, NextResponse } from "next/server";
import { clinicalStore } from "@/lib/clinical-store";
import { extractClinicalData } from "@/lib/documents/extractor";
import { DocumentCategory } from "@/types/medical";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as DocumentCategory) || "lab_report";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // File validation: Size limit 25MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum size limit (25MB)" },
        { status: 400 }
      );
    }

    // Supported formats
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp|heic)$/i)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or image (PNG, JPG, WEBP)." },
        { status: 400 }
      );
    }

    // Add document to vault
    const document = await clinicalStore.addDocument({
      file_name: file.name,
      file_path: `vault/${Date.now()}_${file.name}`,
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      category,
      status: "extracted",
      document_date: new Date().toISOString().split("T")[0],
      summary: `Uploaded ${category.replace("_", " ")} containing clinical data.`,
      tags: [category, "extracted"],
    });

    // Run structured extraction
    const extractedData = extractClinicalData(file.name, category);

    return NextResponse.json(
      {
        document,
        extracted: extractedData,
        message: "Document successfully ingested and structured clinical data extracted.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API/Documents/Upload] Error:", error);
    return NextResponse.json(
      { error: "Document upload failed", message: error?.message },
      { status: 500 }
    );
  }
}
