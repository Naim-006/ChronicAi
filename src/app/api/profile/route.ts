import { NextRequest, NextResponse } from "next/server";
import { clinicalStore } from "@/lib/clinical-store";

export async function GET() {
  try {
    const profile = await clinicalStore.getProfile();
    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve profile", message: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await clinicalStore.updateProfile(body);
    return NextResponse.json({ profile: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update profile", message: error?.message },
      { status: 500 }
    );
  }
}
