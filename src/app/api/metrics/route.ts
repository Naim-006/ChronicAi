import { NextRequest, NextResponse } from "next/server";
import { clinicalStore } from "@/lib/clinical-store";
import { metricInputSchema } from "@/lib/validations/medical";

// Clinical reference evaluation rules
function evaluateAbnormalStatus(
  metric_type: string,
  primary: number,
  secondary?: number,
  context?: string
): { is_abnormal: boolean; ref_low?: number; ref_high?: number } {
  switch (metric_type) {
    case "glucose":
      if (context === "fasting") {
        return { is_abnormal: primary < 70 || primary > 99, ref_low: 70, ref_high: 99 };
      }
      return { is_abnormal: primary < 70 || primary > 140, ref_low: 70, ref_high: 140 };
    case "hba1c":
      return { is_abnormal: primary > 5.6, ref_low: 4.0, ref_high: 5.6 };
    case "blood_pressure":
      const sysAbnormal = primary < 90 || primary >= 130;
      const diaAbnormal = secondary ? secondary < 60 || secondary >= 80 : false;
      return { is_abnormal: sysAbnormal || diaAbnormal, ref_low: 90, ref_high: 120 };
    case "heart_rate":
      return { is_abnormal: primary < 60 || primary > 100, ref_low: 60, ref_high: 100 };
    default:
      return { is_abnormal: false };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";

    const metrics = await clinicalStore.getMetrics(type);

    // Compute key clinical aggregates
    const glucoseMetrics = metrics.filter((m) => m.metric_type === "glucose");
    const meanGlucose =
      glucoseMetrics.length > 0
        ? Math.round(
            glucoseMetrics.reduce((acc, m) => acc + m.value_primary, 0) /
              glucoseMetrics.length
          )
        : null;

    const estimatedHbA1c = meanGlucose
      ? Number(((meanGlucose + 46.7) / 28.7).toFixed(1))
      : null;

    return NextResponse.json({
      metrics,
      analytics: {
        total_records: metrics.length,
        mean_glucose_mg_dl: meanGlucose,
        estimated_hba1c: estimatedHbA1c,
        abnormal_count: metrics.filter((m) => m.is_abnormal).length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve metrics", message: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = metricInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid metric data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { metric_type, value_primary, value_secondary, unit, context, recorded_at, notes } =
      parsed.data;

    const { is_abnormal, ref_low, ref_high } = evaluateAbnormalStatus(
      metric_type,
      value_primary,
      value_secondary,
      context
    );

    const savedMetric = await clinicalStore.addMetric({
      metric_type,
      value_primary,
      value_secondary,
      unit,
      context,
      reference_low: ref_low,
      reference_high: ref_high,
      is_abnormal,
      recorded_at: recorded_at || new Date().toISOString(),
      notes,
    });

    // Auto-log to chronological medical timeline if abnormal
    if (is_abnormal) {
      await clinicalStore.addTimelineEvent({
        event_type: "measurement",
        title: `Abnormal ${metric_type.replace("_", " ").toUpperCase()}: ${value_primary}${value_secondary ? `/${value_secondary}` : ""} ${unit}`,
        description: `Recorded ${context || "vital"} reading outside standard reference range (${ref_low ?? "N/A"} - ${ref_high ?? "N/A"}).`,
        event_date: (recorded_at || new Date().toISOString()).split("T")[0],
        is_verified: true,
      });
    }

    return NextResponse.json(savedMetric, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to save metric", message: error?.message },
      { status: 500 }
    );
  }
}
