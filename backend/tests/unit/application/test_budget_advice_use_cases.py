from __future__ import annotations

from src.application.budget_advice.use_cases import _parse_advice_response


def test_parse_valid_json():
    text = '{"summary": "Bon mois", "tips": ["conseil 1", "conseil 2"], "savings_advice": "Épargnez plus", "sentiment": "positive"}'
    summary, tips, savings, sentiment = _parse_advice_response(text)
    assert summary == "Bon mois"
    assert tips == ["conseil 1", "conseil 2"]
    assert savings == "Épargnez plus"
    assert sentiment == "positive"


def test_parse_null_savings_advice():
    text = '{"summary": "Ok", "tips": [], "savings_advice": null}'
    summary, tips, savings, sentiment = _parse_advice_response(text)
    assert savings is None
    assert sentiment == "neutral"


def test_parse_json_embedded_in_text():
    text = 'Voici ma réponse:\n{"summary": "Résumé", "tips": ["tip"], "savings_advice": null, "sentiment": "negative"}\nFin.'
    summary, tips, savings, sentiment = _parse_advice_response(text)
    assert summary == "Résumé"
    assert tips == ["tip"]
    assert sentiment == "negative"


def test_parse_invalid_json_fallback():
    text = "ceci n'est pas du JSON"
    summary, tips, savings, sentiment = _parse_advice_response(text)
    assert summary == text.strip()
    assert tips == []
    assert savings is None
    assert sentiment == "neutral"
