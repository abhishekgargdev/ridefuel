# UI & Mobile-First UX Guidelines

## 1. Design Philosophy

RideFuel is purpose-built for motorcyclists who frequently interact with their phone while standing beside their bike at a busy fuel station or wearing light riding gloves:

- **High Sunlight Contrast**: Deep slate backgrounds (`#020617`, `#090d16`) with amber-gold (`#f59e0b`) accents reminiscent of classic motorcycle gauges and brass tank badges.
- **Large Touch Targets**: Minimum 44px by 44px tap targets across all primary action buttons.
- **Minimal Roadside Data Entry**:
  - Automatically remembers the last entered price per liter.
  - Automatically calculates total cost from quantity.
  - Defaults to "Full Tank" for fast 1-tap logging.
  - Defaults date to today and time to current clock.

---

## 2. Floating Action Button (FAB) & Mobile Quick Hub

On mobile viewports, the bottom navigation bar features a prominent center button (**+ Quick Log**). Tapping this opens the quick modal drawer:
1. **Add Fuel Refill**: Gas pump icon, orange theme.
2. **Add Odometer Reading**: Speedometer icon, sky-blue theme.
3. **Add Expense**: Currency icon, emerald theme.
4. **Add Maintenance Service**: Wrench icon, violet theme.

---

## 3. UI States Architecture

Every page and component gracefully handles:

- **Loading State**: Shimmering `Skeleton` loaders sized to match the final content blocks to prevent cumulative layout shift (CLS).
- **Empty State**: Clear icons, friendly messages, and prominent action buttons inviting the user to log their first item.
- **Error State**: Alert banners with actionable retry buttons and clear error text.
- **404 Page**: Custom motorcycle-themed "Off the Beaten Trail" not-found screen with dashboard redirect.
- **500 Error Boundary**: Engine sensor glitch screen with component recovery retry handlers.
