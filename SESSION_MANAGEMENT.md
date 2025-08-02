# Gestione Sessione - Documentazione

## Problema Risolto

Il sistema ora gestisce correttamente la scadenza delle sessioni utente e previene disconnessioni improvvise senza preavviso.

## Funzionalità Implementate

### 1. Refresh Automatico dei Token
- **Configurazione Supabase**: `autoRefreshToken: true` con margin di 5 minuti
- **Gestione Eventi**: Listener per `TOKEN_REFRESHED` che aggiorna automaticamente la `sessionExpiry`
- **Logging**: Console log per monitorare i refresh dei token

### 2. Monitoraggio Sessione
- **Hook `useSessionManager`**: Controlla la validità della sessione ogni minuto
- **Soglia di Avviso**: Mostra warning 15 minuti prima della scadenza
- **Controlli Automatici**: Verifica `force_logout` e scadenza locale

### 3. Notifiche Utente
- **Warning Persistente**: Card gialla in alto a destra quando la sessione sta per scadere
- **Toast Notifications**: Notifiche discrete con azioni rapide
- **Modal di Scadenza**: Modal bloccante con countdown automatico quando la sessione è scaduta

### 4. Gestione Eventi
- **sessionExpiring**: Evento custom per avvisi di scadenza imminente
- **sessionExpired**: Evento custom per gestire disconnessioni automatiche
- **Reindirizzamento**: Automatico alla pagina di login con messaggio chiaro

## Configurazione

### Timeout Sessione
Il timeout è configurabile per utente nella tabella `profiles`:
```sql
ALTER TABLE profiles ADD COLUMN session_timeout_minutes INTEGER DEFAULT 480;
```

### Configurazione Supabase
```typescript
export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    refreshTokenMargin: 300, // 5 minuti prima della scadenza
    storageKey: 'forecast-auth-token',
    debug: import.meta.env.DEV
  }
})
```

## Componenti Principali

### SessionManager
- Gestisce warning e modal di scadenza
- Integrato nell'App principale
- Ascolta eventi custom di sessione

### useSessionManager Hook
- Monitora la validità della sessione
- Fornisce funzioni per estendere la sessione
- Calcola tempo rimanente

### SessionExpiredModal
- Modal bloccante per sessioni scadute
- Countdown automatico (10 secondi)
- Reindirizzamento forzato al login

## Testing e Debug

### Utility di Test (Solo Sviluppo)
Nella console del browser sono disponibili:

```javascript
// Forza scadenza immediata
window.sessionTestUtils.forceSessionExpiry()

// Imposta scadenza tra X minuti
window.sessionTestUtils.setSessionExpiryInMinutes(2)

// Ottieni info sessione corrente
window.sessionTestUtils.getSessionInfo()

// Testa refresh token
window.sessionTestUtils.testTokenRefresh()

// Simula eventi
window.sessionTestUtils.simulateSessionExpired()
window.sessionTestUtils.simulateSessionExpiring(5)
```

### Monitoraggio Console
I seguenti log aiutano nel debug:
- `Auth state change: TOKEN_REFRESHED`
- `Token refreshed, session extended until: [timestamp]`
- `Session invalid, signing out`
- `User signed out, clearing session`

## Flusso di Gestione

### Scenario 1: Sessione Attiva
1. Token viene refreshato automaticamente ogni ~55 minuti
2. `sessionExpiry` viene aggiornata ad ogni refresh
3. Utente continua a lavorare senza interruzioni

### Scenario 2: Sessione in Scadenza
1. 15 minuti prima della scadenza: warning giallo
2. Utente può estendere la sessione o fare logout
3. Se ignora: continua il countdown

### Scenario 3: Sessione Scaduta
1. Modal bloccante con messaggio chiaro
2. Countdown di 10 secondi
3. Reindirizzamento automatico al login
4. Messaggio: "La sessione è scaduta. Effettua di nuovo l'accesso."

### Scenario 4: Force Logout
1. Admin imposta `force_logout = true` nel database
2. Al prossimo controllo (max 1 minuto): logout automatico
3. Modal di sessione scaduta

## Configurazioni Consigliate

### Produzione
- `session_timeout_minutes`: 480 (8 ore)
- `refreshTokenMargin`: 300 (5 minuti)
- `checkInterval`: 60000 (1 minuto)
- `warningThreshold`: 15 (15 minuti)

### Sviluppo/Test
- `session_timeout_minutes`: 60 (1 ora)
- Utilizzare utility di test per simulare scenari
- Monitorare console log per debug

## Sicurezza

### Protezioni Implementate
- Token refresh automatico previene scadenze improvvise
- Force logout per disconnessioni amministrative
- Persistenza sicura con chiave dedicata
- Validazione server-side della sessione

### Best Practices
- Non modificare `sessionExpiry` manualmente (eccetto test)
- Utilizzare sempre `extendSession()` per prolungare
- Monitorare log per identificare problemi di rete
- Testare scenari di disconnessione in sviluppo

## Troubleshooting

### Problema: Disconnessioni Frequenti
- Verificare connessione di rete
- Controllare configurazione `refreshTokenMargin`
- Verificare log console per errori di refresh

### Problema: Warning Non Mostrati
- Verificare che `useSessionManager` sia attivo
- Controllare `warningThreshold` nelle opzioni
- Verificare che `SessionManager` sia renderizzato

### Problema: Modal Non Appare
- Verificare listener eventi custom
- Controllare che `SessionExpiredModal` sia incluso
- Verificare stato `showExpiredModal`

## Estensioni Future

### Possibili Miglioramenti
- Sincronizzazione multi-tab
- Backup automatico dati prima del logout
- Configurazione timeout per ruolo utente
- Integrazione con sistema di audit
- Notifiche push per sessioni critiche