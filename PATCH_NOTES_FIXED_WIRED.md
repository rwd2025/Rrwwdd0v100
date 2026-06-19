# RWD-V5-main(4) Fixed + Wired Patch

Kept the original V5 look/layout.

Fixed:
- Added /assets icon folder so manifest and Apple Home Screen icons resolve.
- Updated service worker cache name and made install tolerant so one missing file cannot white-screen the app.
- Added backend-ready wiring adapters:
  - /api/ocr
  - /api/vin/decode
  - /api/parts/lookup
- Camera/scan now saves local scan records and queues backend sync.
- Truck VIN save now queues VIN decode.
- Parts AI lookup now queues backend-ready lookup.
- Debug panel now shows sync queue and scan records.
- Boot listeners are null-safe.

Still backend-ready, not backend-connected until a backend URL/API is added.
