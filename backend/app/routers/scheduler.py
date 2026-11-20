from fastapi import APIRouter, Depends
from app.core.auth import get_current_user, CurrentUser
from app.schemas.scheduler import (
    ParseScheduleRequest,
    ParsedScheduleResponse,
    RefillForecastRequest,
    RefillForecastResponse,
)
from app.services.chrono_service import ChronoSchedulerService

router = APIRouter(tags=["Prescription Scheduler & Refill Forecaster"])


@router.post(
    "/scheduler/parse-schedule",
    response_model=ParsedScheduleResponse,
    summary="Parse clinical Latin prescription frequency into alarm timestamps",
)
async def parse_schedule(
    request: ParseScheduleRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Translates raw Latin prescription frequencies (e.g. `1 tablet BD after meals x 14 days`, `TDS`, `NOCTE`, `PRN`)
    into standardized daily dose frequencies, 24-hour clock alarm timestamps, meal instructions, and duration.
    """
    return ChronoSchedulerService.parse_schedule(
        frequency_text=request.frequency_text,
        medication_name=request.medication_name,
        anchor_time=request.anchor_time or "08:00",
    )


@router.post(
    "/scheduler/refill-forecast",
    response_model=RefillForecastResponse,
    summary="Forecast medication depletion date, reminder threshold, and adherence rate",
)
async def refill_forecast(
    request: RefillForecastRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Calculates remaining drug supply, predicted runout date, refill warning milestone,
    and patient adherence percentage based on recorded doses and consumption rate.
    """
    return ChronoSchedulerService.calculate_refill_forecast(
        medication_name=request.medication_name,
        initial_quantity=request.initial_quantity,
        daily_dose_count=request.daily_dose_count,
        dose_quantity_per_intake=request.dose_quantity_per_intake,
        start_date=request.start_date,
        logged_taken_count=request.logged_taken_count,
        logged_skipped_count=request.logged_skipped_count,
        remaining_quantity=request.remaining_quantity,
        refill_lead_days=request.refill_lead_days,
    )
