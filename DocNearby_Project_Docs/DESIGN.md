# DocNearby — Design System and UX

**Design goal:** Calm, clear, trustworthy, accessible healthcare discovery. Never imply medical certainty or provider superiority without evidence.

## 1. UX principles
- Search first; registration is not required for public discovery.
- Manual search must work when AI is unavailable.
- Show what is known, what is estimated, and what is not verified.
- Avoid dark patterns, sponsored ranking disguised as quality, and false urgency.
- Keep emergency guidance visible without forcing users through an AI flow.
- Design mobile-first for travelers using unreliable networks.

## 2. Primary navigation
- Home
- Find Care
- Saved Providers (signed-in users)
- Appointments (if implemented)
- For Providers
- Help / About
- Account menu

Admin navigation must be separate and role-protected.

## 3. Main search experience
Fields:
- City/location (manual entry always available)
- Specialty
- Language
- Optional fee range and currency
- Optional distance and availability filters only when data supports them

Actions:
- Search
- Clear filters
- Describe what you need (optional AI)

Result cards should show:
- Provider/facility name and type
- Specialty
- Locality/distance if available
- Spoken languages and evidence/source if relevant
- Consultation fee or clear “not provided” label
- Price type and last-confirmed date
- Verification status and what was checked
- View details, call, directions, or appointment request when supported

## 4. Status labels
Use explicit labels:
- Verified — explain the exact checks completed
- Verification pending
- Unverified
- Verification expired
- Suspended
- Price confirmed on [date]
- Price estimate
- Price not provided
- Availability not confirmed
Never use “best doctor” or “trusted” as an unsupported guarantee.

## 5. Provider profile
Sections:
1. Overview and provider/facility type
2. Specialty and qualifications
3. Registration/verification information, source, and date
4. Services and pricing
5. Languages
6. Address, map, directions, accessibility
7. Operating hours and availability status
8. Appointment/contact instructions
9. Report incorrect information

Only render fields backed by data. Never fabricate missing details.

## 6. AI interaction
Prompt example: “Find an English-speaking dermatologist in Kolkata with a consultation fee below ₹1,000.”

Show the interpreted filters before or alongside results so users can correct them. AI should return filter intent, not invented provider facts. Provide:
- AI loading state
- Clear parsing/error state
- “Use manual search” fallback
- Disclaimer that AI helps search and does not diagnose

## 7. Required UI states
- Initial / no query
- Loading / skeleton
- Results
- No results
- Invalid input
- API/network error
- AI unavailable
- Location permission denied
- Provider not found
- Stale price or verification
- Booking request pending / confirmed / failed
- Empty saved-provider list

## 8. Accessibility and responsive design
- Semantic HTML and correctly associated labels
- Keyboard access and visible focus
- Adequate contrast and readable font sizes
- Screen-reader announcements for search results and errors
- Do not rely on color alone for status
- Touch targets suitable for mobile
- Test small screens, zoom, and reduced-motion preferences

## 9. Visual direction
Use a light, calm neutral background, strong readable typography, restrained teal/blue accents, clear cards, and consistent spacing. Avoid clutter and excessive gradients. Use real provider imagery only when licensed and relevant; otherwise use neutral placeholders.

## 10. Design acceptance checklist
- [ ] Manual search is the primary, obvious action
- [ ] AI is optional and never blocks search
- [ ] Price and verification statuses are explicit
- [ ] Empty/error/loading states exist
- [ ] Mobile and keyboard navigation work
- [ ] Emergency guidance is accessible
- [ ] No unsupported trust claims
