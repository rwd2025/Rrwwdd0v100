# Rolling Wrench Diesel BA001 - V5 Look Finished Wiring

This build preserves the RWD-V5 visual layout and adds a finish layer (`ba001-finish.js`) for usable local workflows.

## Wired in this build
- PWA icon path fix with `/assets` folder
- Safer service worker cache version
- Customer database
- Schedule / work order queue
- Parts save + local job-kit lookup
- OCR text parser queue for part numbers/prices
- Parts → invoice flow
- Invoice/quote paper with print/PDF path
- Signature block
- Data export
- Sync queue/backend adapters for future Supabase/OCR/VIN/parts APIs

## Not live until backend keys/endpoints are added
- Real OCR camera extraction
- Live VIN decode
- Live OEM/supplier pricing
- Cloud multi-user sync

The screens work offline using local storage now, and the backend adapters are exposed as `window.BA001Adapters`.
