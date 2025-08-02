# Backlog di Sviluppo ESA Forecast

Questo file raccoglie tutte le attività necessarie per coprire i requisiti mancanti, migliorare le funzionalità esistenti e ottimizzare la UX.

---

## 1. Autenticazione & Sicurezza
- [x] Configurare Supabase Auth: verifica email, reset password SMTP, policy complessità.
- [x] Abilitare MFA per ruoli **Admin** e **Approver**.
- [x] Implementare gestione sessione (scadenza, logout forzato).
- [x] Definire RLS policy su tutte le tabelle sensibili.

## 2. Workflow Approvals
- [x] Integrare tabella `approval_requests` su Supabase.
- [x] Implementare SLA di 3 giorni con reminder automatici (cron function / edge function).
- [x] Diff viewer reale tra versioni forecast (API RPC + componente UI).
- [x] Notifiche e-mail/push su invio, approvazione, rifiuto.

## 3. Sistema Commenti Avanzato
- [x] Mention utenti (@) con autocomplete.
- [x] Emoji picker e rendering.
- [x] Allegati file e preview.
- [x] Stato risolto / riaperto con cronologia.
- [x] Notifiche real-time via Supabase Realtime.

## 4. Forecast Sheet
- [ ] Virtualizzare griglia (react-window / tanstack-virtual) per 10k righe.
- [ ] Inline editing con validazione live (zod + debounce RPC `validate_row`).
- [ ] Color coding dinamico (giallo WIP, verde confermato, rosso errore, viola commento).
- [ ] Autosave ogni 30 s con indicatori di stato.
- [ ] Toolbar flottante (copy, paste, fill-down).

## 5. Import Wizard
- [ ] Sostituire parsing mock con libreria `xlsx`.
- [ ] Persistenza mapping colonne per utente.
- [ ] Validazione server-side con funzione `validate_import`.
- [ ] Salvataggio batch su `forecast_data` + snapshot.

## 6. Report Center
- [ ] Edge Function di generazione PDF (puppeteer) e Excel.
- [ ] Storage file su Supabase Storage con versioning.
- [ ] Scheduler mensile automatico per report "consolidato".
- [ ] Integrazione invio e-mail con allegato / link.

## 7. Dashboard & Alert Center
- [ ] Heat-map clienti (d3/echarts) con drill-down.
- [ ] Global search (⌘/Ctrl+K) con indices su clienti, scenari, commenti.
- [ ] Alert Center con soglie configurabili in `settings` table.

## 8. Admin Panel
- [ ] CRUD utenti, ruoli e assegnazione BL.
- [ ] Gestione anagrafiche (business line, clienti).
- [ ] Configurazione regole validazione e soglie alert.
- [ ] Audit log e download log eventi.

## 9. UX & Accessibilità
- [ ] Toast/Snackbar feedback (success, error, info).
- [ ] Skeleton loader su tabelle.
- [ ] Theme switch light/dark via `useTheme`.
- [ ] Onboarding tour (`react-joyride`).
- [ ] Focus outline accessibile e ARIA roles.

## 10. Real-time & Collaborazione
- [ ] Presence indicator (avatar) per editing simultaneo.
- [ ] Broadcast di modifiche forecast via Supabase Realtime.

## 11. Quality & DevOps
- [ ] Refactor chiamate Supabase in service layer.
- [ ] Aggiungere `react-query` per caching e optimistic UI.
- [ ] ESLint + Prettier strict config.
- [ ] Test e2e (Cypress) su flussi chiave.
- [ ] GitHub Actions CI: lint, test, build.

---

> Aggiorna lo stato delle checkbox man mano che completi le attività.