# Mathematical Calculations & Formulas

RideFuel implements deterministic calculations for motorcycle telemetry to eliminate reliance on inaccurate hardware float gauges.

---

## 1. Full-Tank to Full-Tank Mileage Formula

Because petrol tank floats slosh when turning, braking, or idling on side-stands, single partial refills cannot provide true consumption data. RideFuel computes mileage exclusively across verified full-tank refill intervals.

$$ \text{Distance} = \text{Odometer}_{\text{current full tank}} - \text{Odometer}_{\text{previous full tank}} $$

$$ \text{Fuel Consumed} = \text{Fuel Added at Current Full Tank} $$

$$ \text{Mileage (km/L)} = \frac{\text{Distance}}{\text{Fuel Consumed}} $$

### Why this works:
When refilled to auto-cutoff, the tank volume resets to a known capacity. The volume of fuel required to refill the tank represents the exact volume consumed during that interval.

### Insufficient Data Handling:
If fewer than two full-tank refills exist, RideFuel returns `null` for mileage and clearly displays:
> **"Not enough data to calculate mileage."**

---

## 2. Distance Traveled Formula

$$ \text{Trip Distance} = \text{Odometer}_{\text{current}} - \text{Odometer}_{\text{previous}} $$

### Rollback Protection:
If $\text{Odometer}_{\text{current}} < \text{Odometer}_{\text{previous}}$, the transaction is rejected with HTTP 422 unless the `allowCorrection` flag is passed (e.g. for cluster speedometer calibration or replacement).

---

## 3. Algorithmic Fuel & Range Estimation

Never represented as an actual physical sensor readout. Always explicitly labeled:
- **"Estimated Fuel"**
- **"Estimated Range"**

### Inputs:
- $C_{\text{tank}}$: Total tank capacity in Liters (13.0 L for RE Classic 350)
- $C_{\text{reserve}}$: Reserve capacity threshold in Liters (2.6 L for RE Classic 350)
- $F_{\text{known}}$: Fuel volume at last refill (Full tank capacity or volume refilled)
- $O_{\text{refill}}$: Odometer at last refill
- $O_{\text{current}}$: Latest verified odometer reading
- $M_{\text{avg}}$: Effective average mileage (from verified full-tank history or factory default of 35.0 km/L)

### Formulas:

1. **Distance Traveled Since Refill**:
   $$ \Delta D = O_{\text{current}} - O_{\text{refill}} $$

2. **Estimated Fuel Consumed**:
   $$ F_{\text{consumed}} = \frac{\Delta D}{M_{\text{avg}}} $$

3. **Estimated Remaining Fuel**:
   $$ F_{\text{est}} = \max(0, F_{\text{known}} - F_{\text{consumed}}) $$

4. **Estimated Range to Empty**:
   $$ R_{\text{est}} = \max(0, F_{\text{est}} \times M_{\text{avg}}) $$

5. **Reserve Alert Trigger**:
   $$ \text{isReserve} = F_{\text{est}} \le C_{\text{reserve}} $$

---

## 4. Cost Per Kilometer (Running Expense)

$$ \text{Cost per KM} = \frac{\text{Total Fuel Spend Across Intervals}}{\text{Total Distance Ridden Across Intervals}} $$

For individual refill runs:
$$ \text{Cost per KM}_{\text{run}} = \frac{\text{Total Amount Paid}}{\Delta D} $$

---

## 5. Maintenance Dual-Threshold Evaluation

A maintenance record is evaluated as **Overdue** if:
1. $O_{\text{current}} \ge O_{\text{due}}$ (Target odometer reached or exceeded), **OR**
2. $\text{Date}_{\text{today}} \ge \text{Date}_{\text{due}}$ (Calendar milestone elapsed).

It is marked as **Upcoming** with remaining distance:
$$ \Delta O_{\text{rem}} = O_{\text{due}} - O_{\text{current}} $$
and remaining days:
$$ \Delta T_{\text{days}} = \left\lceil \frac{\text{Date}_{\text{due}} - \text{Date}_{\text{today}}}{86,400,000 \text{ ms}} \right\rceil $$

---

## 6. Dashboard 14 Core KPI Aggregations

| Metric | Computation Formula / Logic | Fallback / Condition |
|---|---|---|
| **1. Current Odometer** | $\max(O_{\text{initial}}, O_{\text{readings}}, O_{\text{fuel}})$ | Returns verified highest odometer recorded. |
| **2. Today's Distance** | $\text{Distance from daily reading for } \text{Date}_{\text{today}}$ | `0` if no trip recorded today. |
| **3. This Month's Distance** | $\sum_{\text{readings in month}} \text{Distance} \text{ or } \sum_{\text{fuel in month}} \Delta D$ | Aggregates calendar month mileage. |
| **4. Estimated Fuel** | $\max(0, F_{\text{last fill}} - \frac{\Delta D_{\text{since refill}}}{M_{\text{avg}}})$ | Returns `null` if no refill logs exist. Triggers reserve badge if $\le C_{\text{reserve}}$. |
| **5. Estimated Range** | $F_{\text{est}} \times M_{\text{avg}}$ | Returns `null` if no refill logs exist. |
| **6. Average Mileage** | Verified full-tank intervals: $\frac{\sum \Delta D}{\sum F_{\text{consumed}}}$ | Returns `null` if $< 2$ full-tank refills. |
| **7. Recent Mileage** | Most recent full-tank interval: $\frac{\Delta D_{\text{last}}}{\Delta F_{\text{last}}}$ | Returns `null` if $< 2$ full-tank refills. |
| **8. Average Petrol Price** | $\frac{\text{Total Fuel Spend}}{\text{Total Fuel Liters}}$ across all logs | Volume-weighted unit price. |
| **9. Total Fuel Expenditure** | $\sum \text{FuelLog.totalAmount}$ | Lifetime petrol spend for vehicle. |
| **10. Current Month Fuel Expenditure** | $\sum_{\text{month}} \text{FuelLog.totalAmount}$ | Current month petrol spend. |
| **11. Total Bike Expenditure** | $\sum \text{FuelLog.totalAmount} + \sum_{\text{non-fuel}} \text{Expense.amount}$ | Total operational lifetime vehicle cost. |
| **12. Cost per Kilometer** | $\frac{\text{Total Fuel Cost}}{\text{Verified Distance}}$ | Running fuel cost per unit distance. |
| **13. Last Fuel Fill** | Most recent `FuelLog` (liters, cost, date, odo, station) | `null` if no fill history recorded. |
| **14. Next Maintenance** | Earliest upcoming or overdue maintenance task | `null` if no tasks scheduled. |

---

## 7. Recharts Telemetry Visualizations

1. **Mileage Trend**: LineChart tracking full-tank interval km/L against the factory-rated expected mileage baseline.
2. **Distance Travelled**: BarChart aggregating monthly riding distances with formatted date ticks.
3. **Fuel Consumption**: BarChart showing monthly refilled volume in Liters.
4. **Fuel Expenditure**: BarChart detailing monthly financial spend on petrol.
5. **Petrol Price Trend**: LineChart plotting price per liter over time across visited fuel stations.
6. **Cost per Kilometer**: LineChart tracing running operational fuel cost per km over time.
7. **Maintenance Expenses**: BarChart displaying periodic servicing, oil change, and parts replacement expenses.
8. **Total Bike Expenditure Breakdown**: Donut PieChart depicting proportional distribution across all expense categories.

---

## 8. Edge Cases Handled

| Scenario | Handled By | Behavior |
|---|---|---|
| Division by zero (zero fuel entered) | Zod Schema + Calculator guards | Form validation rejects 0 or negative quantities |
| Single partial refill | Mileage Calculator | Excluded from full-tank intervals; tracked in expense ledger |
| Odometer rollback / cluster swap | Daily Reading Validation | Rejected with HTTP 422 unless `allowCorrection: true` |
| Negative fuel remainder | Range Calculator | Clamped with `Math.max(0, ...)` |
| Missing fuel refill history | Dashboard Service | Returns safe `null` indicators rather than inventing numbers |
