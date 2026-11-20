import re
from datetime import date, timedelta
from typing import List, Optional, Tuple
from app.schemas.scheduler import (
    ParsedScheduleResponse,
    RefillForecastResponse,
)


class ChronoSchedulerService:
    """
    Clinical prescription timing parser and refill prediction engine.
    Normalizes Latin prescription shorthand, maps physiological circadian timing,
    and calculates stock depletion milestones.
    """

    # Frequency Regex Patterns
    PRN_PATTERN = re.compile(r"\b(prn|p\.r\.n\.|as\s+needed|when\s+needed|sos|s\.o\.s\.)\b", re.IGNORECASE)
    QDS_PATTERN = re.compile(r"\b(qds|qid|q\.i\.d\.|q\.d\.s\.|4\s*times?|four\s*times?|every\s*6\s*h(ours?)?|q6h)\b", re.IGNORECASE)
    TDS_PATTERN = re.compile(r"\b(tds|tid|t\.i\.d\.|t\.d\.s\.|3\s*times?|three\s*times?|thrice|every\s*8\s*h(ours?)?|q8h)\b", re.IGNORECASE)
    BD_PATTERN = re.compile(r"\b(bd|bid|b\.i\.d\.|b\.d\.|2\s*times?|twice|every\s*12\s*h(ours?)?|q12h)\b", re.IGNORECASE)
    NOCTE_PATTERN = re.compile(r"\b(nocte|hs|h\.s\.|at\s+bedtime|bedtime|night|at\s+night|in\s+the\s+evening|qhs)\b", re.IGNORECASE)
    MANE_PATTERN = re.compile(r"\b(mane|morning|in\s+the\s+morning|every\s+morning)\b", re.IGNORECASE)
    OD_PATTERN = re.compile(r"\b(od|qd|q\.d\.|o\.d\.|once\s+daily|daily|once\s+a\s+day|every\s+day|every\s*24\s*h(ours?)?|q24h)\b", re.IGNORECASE)
    QOD_PATTERN = re.compile(r"\b(qod|q\.o\.d\.|every\s+other\s+day|alternate\s+days?)\b", re.IGNORECASE)

    # Meal Instructions Patterns
    AC_PATTERN = re.compile(r"\b(ac|a\.c\.|before\s+meals?|empty\s+stomach|prior\s+to\s+meals?)\b", re.IGNORECASE)
    PC_PATTERN = re.compile(r"\b(pc|p\.c\.|after\s+meals?|following\s+food|post\s+meals?)\b", re.IGNORECASE)
    WITH_FOOD_PATTERN = re.compile(r"\b(with\s+food|with\s+meals?|during\s+meals?)\b", re.IGNORECASE)

    # Duration Patterns
    DURATION_DAYS = re.compile(r"(?:x|for)\s*(\d+)\s*(?:d(?:ays?)?)\b", re.IGNORECASE)
    DURATION_WEEKS = re.compile(r"(?:x|for)\s*(\d+)\s*(?:w(?:eeks?|ks?)?)\b", re.IGNORECASE)
    DURATION_MONTHS = re.compile(r"(?:x|for)\s*(\d+)\s*(?:m(?:onths?|os?)?)\b", re.IGNORECASE)
    CHRONIC_PATTERN = re.compile(r"\b(ongoing|chronic|lifelong|maintenance|indefinite|continuous)\b", re.IGNORECASE)

    @classmethod
    def parse_schedule(
        cls,
        frequency_text: str,
        medication_name: Optional[str] = None,
        anchor_time: str = "08:00",
    ) -> ParsedScheduleResponse:
        """
        Parses unformatted clinical prescription frequency strings into structured times.
        """
        text = frequency_text.strip()

        # Check PRN first
        if cls.PRN_PATTERN.search(text):
            return ParsedScheduleResponse(
                frequency_code="PRN",
                frequency_display="As needed (pro re nata)",
                daily_dose_count=0,
                dose_times=[],
                meal_instruction=cls._extract_meal_instruction(text)[0],
                meal_instruction_display=cls._extract_meal_instruction(text)[1],
                duration_days=cls._extract_duration(text),
                is_prn=True,
                is_chronic=bool(cls.CHRONIC_PATTERN.search(text)),
                notes="Take only when symptoms occur. Adhere to minimum interval between doses.",
            )

        # 4 times daily (QDS / QID)
        if cls.QDS_PATTERN.search(text):
            return ParsedScheduleResponse(
                frequency_code="QDS",
                frequency_display="Four times daily (every 6 hours)",
                daily_dose_count=4,
                dose_times=["08:00", "12:00", "16:00", "20:00"],
                meal_instruction=cls._extract_meal_instruction(text)[0],
                meal_instruction_display=cls._extract_meal_instruction(text)[1],
                duration_days=cls._extract_duration(text),
                is_prn=False,
                is_chronic=bool(cls.CHRONIC_PATTERN.search(text)),
                notes="Evenly spaced 6-hour intervals across waking hours.",
            )

        # 3 times daily (TDS / TID)
        if cls.TDS_PATTERN.search(text):
            return ParsedScheduleResponse(
                frequency_code="TDS",
                frequency_display="Three times daily (every 8 hours)",
                daily_dose_count=3,
                dose_times=["08:00", "14:00", "20:00"],
                meal_instruction=cls._extract_meal_instruction(text)[0],
                meal_instruction_display=cls._extract_meal_instruction(text)[1],
                duration_days=cls._extract_duration(text),
                is_prn=False,
                is_chronic=bool(cls.CHRONIC_PATTERN.search(text)),
                notes="Spaced ~6-8 hours apart (Morning, Mid-afternoon, Evening).",
            )

        # 2 times daily (BD / BID)
        if cls.BD_PATTERN.search(text):
            return ParsedScheduleResponse(
                frequency_code="BD",
                frequency_display="Twice daily (every 12 hours)",
                daily_dose_count=2,
                dose_times=["08:00", "20:00"],
                meal_instruction=cls._extract_meal_instruction(text)[0],
                meal_instruction_display=cls._extract_meal_instruction(text)[1],
                duration_days=cls._extract_duration(text),
                is_prn=False,
                is_chronic=bool(cls.CHRONIC_PATTERN.search(text)),
                notes="Standard 12-hour interval (Morning and Evening).",
            )

        # Night / Bedtime (NOCTE / HS)
        if cls.NOCTE_PATTERN.search(text):
            return ParsedScheduleResponse(
                frequency_code="NOCTE",
                frequency_display="Once daily at bedtime (hora somni)",
                daily_dose_count=1,
                dose_times=["21:30"],
                meal_instruction=cls._extract_meal_instruction(text)[0],
                meal_instruction_display=cls._extract_meal_instruction(text)[1],
                duration_days=cls._extract_duration(text),
                is_prn=False,
                is_chronic=bool(cls.CHRONIC_PATTERN.search(text)),
                notes="Take 30 minutes before sleep for optimal pharmacokinetic profile.",
            )

        # Morning (MANE)
        if cls.MANE_PATTERN.search(text):
            return ParsedScheduleResponse(
                frequency_code="MANE",
                frequency_display="Once daily in the morning",
                daily_dose_count=1,
                dose_times=[anchor_time],
                meal_instruction=cls._extract_meal_instruction(text)[0],
                meal_instruction_display=cls._extract_meal_instruction(text)[1],
                duration_days=cls._extract_duration(text),
                is_prn=False,
                is_chronic=bool(cls.CHRONIC_PATTERN.search(text)),
                notes="Administer with breakfast or morning routine.",
            )

        # Alternate days (QOD)
        if cls.QOD_PATTERN.search(text):
            return ParsedScheduleResponse(
                frequency_code="QOD",
                frequency_display="Every other day (alternate days)",
                daily_dose_count=1,
                dose_times=[anchor_time],
                meal_instruction=cls._extract_meal_instruction(text)[0],
                meal_instruction_display=cls._extract_meal_instruction(text)[1],
                duration_days=cls._extract_duration(text),
                is_prn=False,
                is_chronic=bool(cls.CHRONIC_PATTERN.search(text)),
                notes="Take every 48 hours at regular morning anchor time.",
            )

        # Default standard once daily (OD / QD)
        return ParsedScheduleResponse(
            frequency_code="OD",
            frequency_display="Once daily (omne in die)",
            daily_dose_count=1,
            dose_times=[anchor_time],
            meal_instruction=cls._extract_meal_instruction(text)[0],
            meal_instruction_display=cls._extract_meal_instruction(text)[1],
            duration_days=cls._extract_duration(text),
            is_prn=False,
            is_chronic=bool(cls.CHRONIC_PATTERN.search(text)),
            notes="Standard 24-hour cycle dose.",
        )

    @classmethod
    def calculate_refill_forecast(
        cls,
        medication_name: str,
        initial_quantity: float,
        daily_dose_count: int,
        dose_quantity_per_intake: float = 1.0,
        start_date: Optional[date] = None,
        logged_taken_count: Optional[int] = None,
        logged_skipped_count: Optional[int] = None,
        remaining_quantity: Optional[float] = None,
        refill_lead_days: int = 5,
        today_override: Optional[date] = None,
    ) -> RefillForecastResponse:
        """
        Calculates remaining stock, runout date, reminder threshold, and compliance percentage.
        """
        today = today_override or date.today()
        calc_start = start_date or today

        daily_rate = dose_quantity_per_intake * daily_dose_count

        # 1. Determine current stock
        if remaining_quantity is not None:
            current_stock = max(0.0, float(remaining_quantity))
        elif logged_taken_count is not None:
            consumed = logged_taken_count * dose_quantity_per_intake
            current_stock = max(0.0, round(initial_quantity - consumed, 2))
        else:
            elapsed_days = max(0, (today - calc_start).days)
            estimated_consumed = elapsed_days * daily_rate
            current_stock = max(0.0, round(initial_quantity - estimated_consumed, 2))

        # 2. Days of supply remaining
        if daily_rate > 0:
            days_remaining = round(current_stock / daily_rate, 1)
        else:
            days_remaining = 999.0

        # 3. Target dates
        predicted_runout_date = today + timedelta(days=int(days_remaining))
        refill_reminder_date = predicted_runout_date - timedelta(days=refill_lead_days)
        if refill_reminder_date < today:
            refill_reminder_date = today

        # 4. Adherence calculation
        adherence_rate_pct = None
        if logged_taken_count is not None and logged_skipped_count is not None:
            total_logged = logged_taken_count + logged_skipped_count
            if total_logged > 0:
                adherence_rate_pct = round((logged_taken_count / total_logged) * 100.0, 1)

        # 5. Determine status tier & friendly message
        if current_stock <= 0 or days_remaining <= 1.0:
            status = "CRITICAL"
            status_message = f"🚨 {medication_name} is out of stock or will run out tomorrow! Immediate refill required."
        elif days_remaining <= refill_lead_days:
            status = "LOW_SUPPLY"
            status_message = f"⚠️ Low supply warning: only {int(days_remaining)} days remaining. Order your refill now."
        elif today >= refill_reminder_date:
            status = "REFILL_DUE"
            status_message = f"Refill recommended soon. Supply predicted to last until {predicted_runout_date.strftime('%b %d, %Y')}."
        else:
            status = "HEALTHY"
            status_message = f"Supply healthy: {int(days_remaining)} days remaining (until {predicted_runout_date.strftime('%b %d, %Y')})."

        return RefillForecastResponse(
            medication_name=medication_name,
            current_stock=current_stock,
            daily_consumption_rate=daily_rate,
            days_of_supply_remaining=days_remaining,
            predicted_runout_date=predicted_runout_date,
            refill_reminder_date=refill_reminder_date,
            adherence_rate_pct=adherence_rate_pct,
            status=status,
            status_message=status_message,
        )

    @classmethod
    def _extract_meal_instruction(cls, text: str) -> Tuple[Optional[str], Optional[str]]:
        if cls.AC_PATTERN.search(text):
            return "before_meal", "Take 30 minutes before meals on an empty stomach"
        if cls.WITH_FOOD_PATTERN.search(text):
            return "with_meal", "Take with or immediately after food"
        if cls.PC_PATTERN.search(text):
            return "after_meal", "Take 15-30 minutes after meals with plenty of water"
        return None, None

    @classmethod
    def _extract_duration(cls, text: str) -> Optional[int]:
        m_days = cls.DURATION_DAYS.search(text)
        if m_days:
            return int(m_days.group(1))

        m_weeks = cls.DURATION_WEEKS.search(text)
        if m_weeks:
            return int(m_weeks.group(1)) * 7

        m_months = cls.DURATION_MONTHS.search(text)
        if m_months:
            return int(m_months.group(1)) * 30

        return None
