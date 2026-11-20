import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import get_current_user, CurrentUser
from app.services.chrono_service import ChronoSchedulerService


@pytest.fixture
def client():
    # Override auth dependency to provide a mock authenticated user
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id="test-patient-uuid-1234",
        email="patient@chronicai.test",
        role="authenticated",
    )
    yield TestClient(app)
    app.dependency_overrides.clear()


# ============================================================================
# Service Layer Unit Tests: ChronoSchedulerService
# ============================================================================

def test_parse_schedule_bd_after_meals():
    result = ChronoSchedulerService.parse_schedule("1 tablet BD after meals x 14 days")
    assert result.frequency_code == "BD"
    assert result.daily_dose_count == 2
    assert result.dose_times == ["08:00", "20:00"]
    assert result.meal_instruction == "after_meal"
    assert result.duration_days == 14
    assert result.is_prn is False


def test_parse_schedule_tds():
    result = ChronoSchedulerService.parse_schedule("Amoxicillin 500mg TDS pc for 7 days")
    assert result.frequency_code == "TDS"
    assert result.daily_dose_count == 3
    assert result.dose_times == ["08:00", "14:00", "20:00"]
    assert result.meal_instruction == "after_meal"
    assert result.duration_days == 7


def test_parse_schedule_qds():
    result = ChronoSchedulerService.parse_schedule("QID every 6 hours x 5 days")
    assert result.frequency_code == "QDS"
    assert result.daily_dose_count == 4
    assert len(result.dose_times) == 4


def test_parse_schedule_nocte():
    result = ChronoSchedulerService.parse_schedule("Atorvastatin 20mg 1 tab at bedtime")
    assert result.frequency_code == "NOCTE"
    assert result.daily_dose_count == 1
    assert result.dose_times == ["21:30"]


def test_parse_schedule_prn():
    result = ChronoSchedulerService.parse_schedule("Salbutamol Inhaler 2 puffs PRN for wheezing")
    assert result.frequency_code == "PRN"
    assert result.daily_dose_count == 0
    assert result.dose_times == []
    assert result.is_prn is True


def test_parse_schedule_chronic():
    result = ChronoSchedulerService.parse_schedule("Metformin 850mg OD morning chronic maintenance")
    assert result.frequency_code in ["MANE", "OD"]
    assert result.daily_dose_count == 1
    assert result.is_chronic is True


def test_refill_forecast_healthy_stock():
    today = date(2026, 11, 20)
    forecast = ChronoSchedulerService.calculate_refill_forecast(
        medication_name="Metformin 500mg",
        initial_quantity=60.0,
        daily_dose_count=2,
        dose_quantity_per_intake=1.0,
        start_date=today,
        today_override=today,
        refill_lead_days=5,
    )
    assert forecast.current_stock == 60.0
    assert forecast.daily_consumption_rate == 2.0
    assert forecast.days_of_supply_remaining == 30.0
    assert forecast.predicted_runout_date == today + timedelta(days=30)
    assert forecast.status == "HEALTHY"


def test_refill_forecast_with_adherence_and_low_supply():
    today = date(2026, 11, 20)
    forecast = ChronoSchedulerService.calculate_refill_forecast(
        medication_name="Atorvastatin 20mg",
        initial_quantity=30.0,
        daily_dose_count=1,
        dose_quantity_per_intake=1.0,
        logged_taken_count=26,
        logged_skipped_count=4,
        today_override=today,
        refill_lead_days=5,
    )
    # Remaining: 30 - 26 = 4 tablets remaining (< 5 lead days -> LOW_SUPPLY)
    assert forecast.current_stock == 4.0
    assert forecast.days_of_supply_remaining == 4.0
    assert forecast.status == "LOW_SUPPLY"
    # Adherence: 26 taken out of 30 total logged = 86.7%
    assert forecast.adherence_rate_pct == 86.7


def test_refill_forecast_critical_out_of_stock():
    today = date(2026, 11, 20)
    forecast = ChronoSchedulerService.calculate_refill_forecast(
        medication_name="Insulin Glargine",
        initial_quantity=100.0,
        daily_dose_count=2,
        remaining_quantity=1.0,
        today_override=today,
        refill_lead_days=3,
    )
    assert forecast.current_stock == 1.0
    assert forecast.status == "CRITICAL"


# ============================================================================
# API Endpoint Integration Tests
# ============================================================================

def test_api_parse_schedule(client):
    response = client.post(
        "/api/v1/scheduler/parse-schedule",
        json={
            "frequency_text": "1 tablet BD after meals x 14 days",
            "medication_name": "Metformin",
            "anchor_time": "08:00",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["frequency_code"] == "BD"
    assert data["daily_dose_count"] == 2
    assert data["dose_times"] == ["08:00", "20:00"]
    assert data["meal_instruction"] == "after_meal"
    assert data["duration_days"] == 14


def test_api_refill_forecast(client):
    response = client.post(
        "/api/v1/scheduler/refill-forecast",
        json={
            "medication_name": "Metformin 500mg",
            "initial_quantity": 60.0,
            "daily_dose_count": 2,
            "dose_quantity_per_intake": 1.0,
            "logged_taken_count": 10,
            "logged_skipped_count": 2,
            "refill_lead_days": 5,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["medication_name"] == "Metformin 500mg"
    assert data["current_stock"] == 50.0
    assert data["daily_consumption_rate"] == 2.0
    assert data["days_of_supply_remaining"] == 25.0
    assert data["adherence_rate_pct"] == 83.3
    assert data["status"] == "HEALTHY"
