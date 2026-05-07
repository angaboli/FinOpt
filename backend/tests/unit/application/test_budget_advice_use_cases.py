from __future__ import annotations

from src.application.budget_advice.use_cases import _parse_advice_response


def test_parse_valid_json():
    text = '{"summary": "Bon mois", "tips": ["conseil 1", "conseil 2"], "savings_advice": "Épargnez plus"}'
    summary, tips, savings = _parse_advice_response(text)
    assert summary == "Bon mois"
    assert tips == ["conseil 1", "conseil 2"]
    assert savings == "Épargnez plus"


def test_parse_null_savings_advice():
    text = '{"summary": "Ok", "tips": [], "savings_advice": null}'
    summary, tips, savings = _parse_advice_response(text)
    assert savings is None


def test_parse_json_embedded_in_text():
    text = 'Voici ma réponse:\n{"summary": "Résumé", "tips": ["tip"], "savings_advice": null}\nFin.'
    summary, tips, savings = _parse_advice_response(text)
    assert summary == "Résumé"
    assert tips == ["tip"]


def test_parse_invalid_json_fallback():
    text = "ceci n'est pas du JSON"
    summary, tips, savings = _parse_advice_response(text)
    assert summary == text.strip()
    assert tips == []
    assert savings is None
