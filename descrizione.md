# Visione d’insieme

Entra in un’unica piattaforma web – **leggera, responsive e protetta dal Single Sign-On aziendale** – dove l’intero processo di *forecast* prende vita: dall’immissione dei numeri al confronto con il budget, dalla discussione fra colleghi fino all’approvazione finale e alla generazione automatica di report direzionali. L’interfaccia rimpiazza il classico foglio Excel con un’esperienza coerente, accessibile e condivisa in tempo reale.

> **Accessibilità & localizzazione**  
> - Contrasto cromatico WCAG AA, focus-state evidenziati e supporto screen-reader ARIA.  
> - Interfaccia disponibile in IT / EN (switch dal profilo utente).  
> - Navigazione ottimizzata anche per tablet: Dashboard, Approvals e Report Center si adattano in layout «card».

---

## 1. Esperienza utente e ruoli

| Ruolo        | Funzioni chiave                                                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Viewer**   | Consulta KPI, applica filtri e drill-down (Business Line, Cliente, periodo), scarica PDF consolidati, segue thread di commento; **non** modifica dati né esporta Excel raw. |
| **Editor**   | Compila il forecast, importa file, apre/risponde ai commenti, avvia il flusso di approvazione.                                                                              |
| **Approver** | Riceve notifiche, esamina diff tra versioni, approva o rimanda con note (SLA: 3 gg; reminder automatico al superamento).                                                    |
| **Admin**    | Gestisce utenti, ruoli, anagrafiche, regole colore, finestre di editing, backup, log e mailing list di distribuzione report.                                                |

Dopo l’autenticazione, ogni utente atterra su una **Dashboard personale** con KPI, alert e un widget “Azioni pendenti” che evidenzia i task rilevanti per il proprio ruolo (bozze da completare, forecast da approvare, commenti in attesa di risposta).

---

## 2. Pagine principali e funzionalità

### a) Dashboard

- **KPI cards animate** che mostrano **Budget Dichiarato**, **Attivo** e **Fast Rolling** del periodo corrente, con frecce e micro-sparklines per evidenziare lo scostamento rispetto al budget o al mese precedente.  
- **Heat-map interattiva** dei 10 clienti a maggior crescita/decrescita.  
- **Alert center** che segnala valori fuori tolleranza (default: Fast Rolling > 10 % di Attivo oppure Attivo > 5 % di Dichiarato). Le soglie sono configurabili dall’Admin per Business Line o cliente.  
- **Barra temporale**: selettore di periodo che ricarica la dashboard su qualsiasi mese storico.  
- **Ricerca globale (⌘/Ctrl + K)** su clienti, commenti, documenti e report.  

### b) Forecast Hub

Tabella filtrabile che elenca ogni mese creato (Gennaio → Dicembre) con stato («Draft», «In Review», «Approved»), percentuale di completamento e badge colorati. Con il pulsante «+» l’Editor lancia un wizard che propone il mese di competenza, clona le anagrafiche dell’anno precedente e applica valori di default. **Responsabile di Business Line** viene assegnato automaticamente in base a mappatura BL ↔ utente definita in Admin.

### c) Foglio Forecast

Replica la familiarità di Excel, arricchita da collaborazione e validazioni live.

- **Vista griglia** con colonne fisse **Business Line** e **Cliente**.  
- **Blocchi comprimibili** per Business Line (es. «D03 Totale – Impianti», «D04 Totale – Servizi») con riga di totalizzazione in grassetto.  
- **Colonne finanziarie**: **Budget Dichiarato – Budget Attivo – Fast Rolling**.  
- **Color coding** (palette brand blu / giallo / viola):  
  - **Giallo** → work-in-progress  
  - **Verde** → valori confermati  
  - **Rosso** → violazione di regola  
  - **Triangolo viola** → presenza di commento.  
- **Commenti contestuali**  
  - Pannello laterale con thread, mention, emoji, allegati.  
  - Thread **marcabili “Risolto”**: il triangolo scompare, cronologia consultabile.  
  - Overlay anteprima on-hover.  
- **Header informativo** (sticky): «Preparato da», «Mese di competenza», data di *cut-off*.  
- **Validazione live** (< 1 s): controllo regole, aggiornamento subtotal e totali (fino a 10 k righe in < 2 s).  
- **Produttività Excel-like**: multi-selezione e fill-down, autocomplete clientela, azioni bulk, **filtri salvati/preferiti** per riaprire rapidamente viste ricorrenti.  

### d) Dettaglio Cliente

- **Timeline grafica** mensile di Dichiarato / Attivo / Fast Rolling vs budget iniziale.  
- **Schede**: «Informazioni» (anagrafica), «Documenti» (contratti, addendum), «Commenti» filtrati sul cliente.  
- **Export PDF** completo della storia del cliente (valori + commenti risolti).  

### e) Import Wizard

1. **Drag & drop** file (Excel/CSV).  
2. **Mappatura colonne** (memorizzata per import futuri).  
3. **Anteprima validazione** con righe barrate o evidenziate.  
4. **Riepilogo**: con import **parziale** – righe valide caricate subito; righe errate nel pannello “Anomalie” per correzione.  

### f) Report Center

- **PDF consolidato mensile** – generato nottetempo, inviato ad **Approver, CFO, CEO, mailing-list “Board-Reports”** (configurabile).  
- **Export Excel raw** per analisi locali.  
- **Dataset BI** – push notturno in formato **Parquet** su data-lake aziendale (+ link al portale BI).  

### g) Approvals

Flusso **a due livelli** (Responsabile BL → CFO/Finance): diff-viewer, approva / rifiuta / modifica minore. Reminder automatico se SLA 3 gg scaduto.

### h) History / Snapshot

Timeline con snapshot mensili **completi di valori, stato celle, commenti e firme** (allegati referenziati via timestamp). Ripristino solo in ambiente test per *what-if*.

### i) Admin

- **Utenti & ruoli** (invita, sospendi, reset, mappatura BL).  
- **Anagrafiche** Business Line e Clienti (campi personalizzabili).  
- **Regole colore & validazione** via UI, senza codice.  
- **Soglie alert** per BL / cliente.  
- **Mailing list report** gestibile da interfaccia.  
- **Log eventi** con retention **12 mesi**: login/logout, import, edit valori, change state, commenti, download report, modifiche regole/permessi/alert.  
- **Compliance**: audit esportabile, note DPIA / GDPR (diritto all’oblio su anagrafiche cliente, encryption at rest).  
- **Backup & disaster-recovery** con retention 35 gg (DB) + snapshot codice.  

---

## 3. Flussi narrativi di lavoro

1. **Creazione scenario** – Editor crea nuovo mese, sistema lo imposta in «Draft» e assegna responsabile BL.  
2. **Compilazione** – Import Wizard, validazione live, celle colorate in diretta.  
3. **Discussione** – Thread commenti, mention, risoluzione.  
4. **Approvazione** – Invia per approvazione, due livelli, reminder se SLA superato.  
5. **Congelamento** – Snapshot immutabile, PDF consolidato generato e notificato.  

---

## 4. Valore aggiunto rispetto a Excel

- **Consistenza**: validazioni server-side.  
- **Collaborazione simultanea**: commenti, presenza realtime.  
- **Audit & compliance**: log completo, GDPR ready.  
- **Scalabilità**: nuove BL o voci senza macro.  
- **Automazione**: snapshot, reporting, dataset BI.  
- **Prestazioni**: autosave < 1 s, diff-viewer 10 k righe < 2 s.  
- **Accessibilità & mobile**: WCAG AA, design responsive.  

---

## 5. On-boarding e supporto

- **Tour guidato interattivo** alla prima login (5 passi).  
- **Centro help** con FAQ, video tutorial e ricerca full-text.  
- **Supporto in-app** (live-chat), tempo medio risposta < 1 h.  

---

## 6. Esempio completo di utilizzo – “Forecast Settembre 2025”

> **Personaggi:**  
> - *Maria Rossi* – Editor, controller di Business Line «D04 Servizi».  
> - *Luca Bianchi* – Responsabile BL (Approver 1).  
> - *Chiara Verdi* – CFO (Approver 2).  
> - *Paolo Neri* – Viewer del team commerciale.

| Fase                            | Azione dettagliata                                                                                                                                                        | Pagine/feature coinvolte        | Note di sistema                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **0. Login**                    | Maria effettua SSO e approda sulla **Dashboard**.                                                                                                                         | Dashboard                       | Widget «Azioni pendenti» mostra «0 bozze, 0 revisioni».                                                                   |
| **1. Creazione scenario**       | Clicca «+ Nuovo mese» nel **Forecast Hub**. Seleziona «Settembre 2025», chiede di copiare dati Set 2024.                                                                  | Forecast Hub (wizard)           | Sistema clona anagrafiche, stato «Draft», assegna Luca come Responsabile BL. Notifica push a Maria: «Scenario creato».    |
| **2. Import dati**              | Drag-and-drop file Excel inviato dai controller locali nel **Import Wizard**.                                                                                             | Import Wizard                   | 740 righe valide → importate; 12 righe errate → pannello «Anomalie».                                                      |
| **3. Validazione & correzioni** | Maria apre il **Foglio Forecast**. Celle gialle indicano le 12 anomalie. Usa filtro salvato «Solo errori» per concentrarsi sui problemi, corregge i valori.               | Foglio Forecast                 | Ciascuna correzione trigga validazione live; al completamento le celle diventano verdi. Subtotali della BL si aggiornano. |
| **4. Discussione**              | Nota che il cliente «ACME SpA» ha Fast Rolling molto superiore al Dichiarato. Seleziona la riga, apre un **commento**, menziona @Luca\_Bianchi.                           | Foglio Forecast (comment panel) | Triangolo viola compare; Luca riceve mail + notifica in-app.                                                              |
| **5. Revisione BL**             | Luca accede, filtra «Commenti non risolti», risponde: «OK, contratto in firma la prossima settimana». Marca il thread «Risolto».                                          | Foglio Forecast                 | Triangolo sparisce, storico commento visibile.                                                                            |
| **6. Invio per approvazione**   | Maria clicca «Invia per approvazione».                                                                                                                                    | Foglio Forecast → Approvals     | Stato cambia «In Review (1/2)». Notifica a Luca.                                                                          |
| **7. Approver 1**               | Luca apre **Approvals**, vede diff-viewer (colonne Fast Rolling in verde). Clicca «Approvare».                                                                            | Approvals                       | Stato «In Review (2/2)». Notifica a Chiara (CFO).                                                                         |
| **8. Approver 2**               | Chiara entra, nota scostamento Budget Attivo > 5 % Dichiarato per ACME. Usa pulsante «Richiedi modifica minore», lascia nota «Aggiornare Dichiarato con nuovo contratto». | Approvals                       | Scenario torna «In Review (1/2)» con commento. Reminder automatico a Maria.                                               |
| **9. Rettifica**                | Maria aggiorna valore Dichiarato per ACME, convalida; soglia rientra nei limiti (cella diventa verde). Re-invio approvazione.                                             | Foglio Forecast → Approvals     |                                                                                                                           |
| **10. Approvazione finale**     | Luca approva (auto, nessuna differenza). Chiara approva entro SLA.                                                                                                        | Approvals                       | Stato «Approved», snapshot time-stamp 30-09-2025 23:59.                                                                   |
| **11. Congelamento & report**   | Processo notturno genera PDF consolidato, lo invia a board; dataset BI aggiornato in data-lake; Paolo (Viewer) scarica PDF dalla **Report Center**.                       | Report Center                   | Log evento: «Download report sensibile da Viewer».                                                                        |
| **12. Analisi storico**         | Il mese dopo, Paolo usa **History / Snapshot** per confrontare Set 2025 vs Ago 2025; attiva lampeggio differenze.                                                         | History / Snapshot              | Nessun rischio di edit: snapshot read-only.                                                                               |

### Conclusione

La piattaforma unifica e governa tutte le fasi del forecast, sostituendo il foglio Excel con uno strumento aziendale moderno, performante e conforme alle policy di sicurezza e accessibilità. Wireframe, prototipi e piani di rollout sono disponibili per approfondimenti.
