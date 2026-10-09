# Interaktywne Kompendium Wyceny Spółki DCF (Discounted Cash Flow)

Dedykowana aplikacja edukacyjna i analityczna w standardzie **Lyceum (SaaS Light EdTech)**, łącząca rygorystyczne wyprowadzenia matematyczne i finansowe z interaktywnymi symulatorami wizualnymi, macierzą wrażliwości oraz symulacją Monte Carlo.

---

## Szybkie Uruchomienie

Aplikacja jest w pełni samodzielna (standalone) i działa bezpośrednio w przeglądarce bez konieczności kompilacji czy instalowania paczek Node.js.

### Otwarcie lokalne:
```bash
open index.html
```

### Uruchomienie serwera developerskiego:
```bash
python3 -m http.server 8080
# Otwórz w przeglądarce: http://localhost:8080
```

---

## Architektura Dydaktyczna & Moduły

1. **Wartość Pieniądza w Czasie (Time Value of Money - TVM)**
   - Równanie wartości bieżącej ($PV = CF_t / (1+r)^t$).
   - Wizualizacja erozji wartości przyszłych przepływów (nominalne vs zdyskontowane).
   - Suwaki stopy dyskonta ($r$), horyzontu ($T$), wzrostu nominalnego ($g$) i wielkości przepływów.

2. **Anatomia Wolnych Przepływów: FCFF vs FCFE**
   - Rygorystyczne wyprowadzenie $FCFF = EBIT(1-t) + D\&A - CapEx - \Delta NWC$.
   - Interaktywny wykres wodospadowy (Waterfall Chart) pokazujący most z EBIT do FCFF.
   - Porównanie modelu podmiotu (Entity / Unlevered) z modelem kapitału własnego (Equity / Levered FCFE).

3. **Średnioważony Koszt Kapitału (WACC) & Równanie Hamady**
   - Formuła WACC oraz model CAPM.
   - Odlewarowanie i zalewarowanie Bety według równania Hamady ($\beta_L = \beta_U [1 + (1-t)D/E]$).
   - Wykres U-kształtnej krzywej WACC w funkcji wskaźnika zadłużenia ($D/V$) z uwzględnieniem tarczy podatkowej i rosnącego ryzyka niewypłacalności.

4. **Wartość Rezydualna (Terminal Value - TV) & Paradoks Horyzontu**
   - Model Wzrostu Wieczystego Gordona-Shapiro ($TV = \frac{FCFF_{T+1}}{WACC - g}$).
   - Warunek zbieżności szeregu geometrycznego ($WACC > g$) i ograniczenie wzrostu długoterminowym tempem PKB.
   - Złota reguła Damodarana: $g = ROIC \times \text{Stopa Reinwestycji}$.
   - Metoda Mnożnika Wyjścia (Exit Multiple EV/EBITDA).
   - Wykres pierścieniowy dekompozycji EV (dlaczego TV stanowi 60-85% wyceny).

5. **Most Wyceny: Od Enterprise Value do Ceny Akcji (Equity Bridge)**
   - Krok po kroku: $EV + \text{Gotówka} - \text{Dług} + \text{Aktywa Nieoperacyjne} - \text{Mniejszości} - \text{ESOP} = \text{Equity Value}$.
   - Przeliczenie na jedną akcję rozwodnioną (Diluted Shares) oraz wskaźnik Margin of Safety.

6. **Macierz Wrażliwości 5×5 (WACC vs Stopa Wzrostu g)**
   - Dwuwymiarowa mapa ciepła (Heatmap) wyceny implikowanej z podświetleniem komórki bazowej.
   - Gotowe scenariusze makroekonomiczne: Niedźwiedzi (Bear), Bazowy (Base), Byczy (Bull).

7. **Symulator Monte Carlo DCF**
   - Silnik stochastyczny generujący tysiące prób (Box-Muller transform dla rozkładów normalnych parametrów).
   - Histogram gęstości prawdopodobieństwa wyceny akcji z naniesionym kursem giełdowym i medianą.
   - Statystyki percentylowe P10, P50 (mediana), P90 oraz szacowane prawdopodobieństwo niedowartościowania.

8. **Pełny Model Sandbox: 4 Archetypy Biznesowe**
   - Predefiniowane profile: Global Big Tech, Dojrzały Przemysł / Utility, High-Growth SaaS, FMCG / Spółka Konsumencka.
   - Interaktywna 5-letnia prognoza rok po roku, elastyczny bilans i dynamiczny wykres słupkowy PV.

9. **5 Kardynalnych Błędów w Wycenie DCF**
   - Omówienie niedopasowania dyskonta (mismatch), pułapki SBC, iluzji wiecznego wzrostu $g > \text{PKB}$ oraz bilansowania CapEx z amortyzacją.

10. **Interaktywny Quiz Diagnostyczny**
    - 6 pytań sprawdzających wiedzę teoretyczną i pułapki analityczne z natychmiastowym feedbackiem i licznikiem punktów.

11. **Produkcyjny Skrypt Python**
    - Kompletny, czysty kod Python (`numpy`, `dataclasses`) implementujący model DCF, mostek kapitałowy i symulację Monte Carlo z opcją kopiowania jednym kliknięciem.

---

## Weryfikacja Jakości (Automated Tests)

Testy automatyczne uruchamiane są przez skrypt Playwright w trybie headless:
```bash
./.venv312/bin/python verify_site.py
```
Test weryfikuje 0 błędów konsoli, pełną reaktywność kontrolek, poprawne działanie quizu oraz generuje zrzut ekranu `full_page_verified.png`.
