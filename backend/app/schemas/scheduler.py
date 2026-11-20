from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date


class ParseScheduleRequest(BaseModel):
    frequency_text: str = Field(
        ...,
        description="Raw Latin or natural language frequency text (e.g., '1 tablet BD after meals x 14 days', 'TDS', 'OD at bedtime')",
        examples=["1 tablet BD after meals x 14 days", "TDS pc", "OD mane", "2 puffs PRN for wheezing"],
    )
    medication_name: Optional[str] = Field(
        None,
        description="Optional medication name for context (e.g., 'Metformin 500mg')",
    )
    anchor_time: Optional[str] = Field(
        "08:00",
        description="Anchor morning time in HH:MM format (default: '08:00')",
        examples=["08:00"],
    )


class ParsedScheduleResponse(BaseModel):
    frequency_code: str = Field(..., description="Standard clinical code: OD, BD, TDS, QDS, PRN, MANE, NOCTE, or CUSTOM")
    frequency_display: str = Field(..., description="Human-readable explanation of dosing interval")
    daily_dose_count: int = Field(..., description="Number of doses required per 24-hour cycle (0 for PRN)")
    dose_times: List[str] = Field(..., description="Calculated 24-hour clock alarm timestamps (e.g. ['08:00', '20:00'])")
    meal_instruction: Optional[str] = Field(None, description="Relation to meals: 'before_meal', 'with_meal', 'after_meal', or 'any'")
    meal_instruction_display: Optional[str] = Field(None, description="Patient-facing meal guidance")
    duration_days: Optional[int] = Field(None, description="Total days for course, or None if ongoing/chronic")
    is_prn: bool = Field(False, description="True if medication is taken only as needed")
    is_chronic: bool = Field(False, description="True if lifelong or maintenance medication")
    notes: Optional[str] = Field(None, description="Clinical chrono-guidance and timing notes")


class RefillForecastRequest(BaseModel):
    medication_name: str = Field(..., description="Name of medication (e.g. 'Metformin 500mg')")
    start_date: Optional[date] = Field(None, description="Start date of current supply (defaults to today)")
    initial_quantity: float = Field(..., gt=0, description="Total units/tablets in package or bottle")
    dose_quantity_per_intake: float = Field(1.0, gt=0, description="Number of units per dose (e.g., 1.0 for 1 tablet)")
    daily_dose_count: int = Field(..., ge=1, description="Number of doses taken per day")
    logged_taken_count: Optional[int] = Field(None, ge=0, description="Total doses logged as taken so far")
    logged_skipped_count: Optional[int] = Field(None, ge=0, description="Total doses logged as skipped")
    remaining_quantity: Optional[float] = Field(None, ge=0, description="Current known pill count if manually audited")
    refill_lead_days: int = Field(5, ge=1, le=30, description="Safety threshold days before exhaustion to issue warning")


class RefillForecastResponse(BaseModel):
    medication_name: str
    current_stock: float = Field(..., description="Estimated or audited remaining units")
    daily_consumption_rate: float = Field(..., description="Daily units consumed (dose_quantity * daily_dose_count)")
    days_of_supply_remaining: float = Field(..., description="Remaining days until zero stock")
    predicted_runout_date: date = Field(..., description="Estimated date when supply reaches 0")
    refill_reminder_date: date = Field(..., description="Date patient should order refill")
    adherence_rate_pct: Optional[float] = Field(None, description="Adherence percentage based on taken vs scheduled")
    status: str = Field(..., description="Status tier: 'CRITICAL', 'LOW_SUPPLY', 'REFILL_DUE', or 'HEALTHY'")
    status_message: str = Field(..., description="Patient-friendly status banner")
