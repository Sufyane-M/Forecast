# ESA Forecast Platform

Piattaforma web moderna per la gestione del forecast aziendale di ESA - Ecologia Soluzione Ambiente.

## 🚀 Caratteristiche

- **Autenticazione sicura** con Supabase Auth (email/password)
- **Dashboard interattiva** con KPI e alert in tempo reale
- **Foglio Forecast** collaborativo simile a Excel
- **Sistema di approvazioni** a due livelli
- **Gestione ruoli** (Viewer, Editor, Approver, Admin)
- **Design responsive** ottimizzato per desktop e tablet
- **Accessibilità WCAG AA** compliant
- **Brand identity ESA** integrata

## 🛠️ Stack Tecnologico

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS + Design System ESA
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📋 Prerequisiti

- Node.js 18+ 
- npm o pnpm
- Account Supabase attivo

## ⚙️ Configurazione

### 1. Clona il repository
```bash
git clone <repository-url>
cd forecast
```

### 2. Installa le dipendenze
```bash
npm install
# oppure
pnpm install
```

### 3. Configura le variabili d'ambiente

Copia il file `.env.example` in `.env` e configura le tue credenziali Supabase:

```bash
cp .env.example .env
```

Modifica `.env` con i tuoi dati:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Configura il database Supabase

Il database è già configurato con:
- ✅ Tabelle principali (profiles, business_lines, clients, forecast_scenarios, etc.)
- ✅ Row Level Security (RLS) policies
- ✅ Trigger per timestamp automatici
- ✅ Dati di esempio

### 5. Configura l'autenticazione Supabase

Nel pannello Supabase:
1. Vai su **Authentication > Settings**
2. Configura **Email Templates** per conferma account e reset password
3. Imposta **SMTP Settings** per l'invio email
4. Abilita **Email confirmation** nelle impostazioni

## 🚀 Avvio dell'applicazione

### Sviluppo
```bash
npm run dev
# oppure
pnpm dev
```

L'applicazione sarà disponibile su `http://localhost:5173`

### Build di produzione
```bash
npm run build
npm run preview
```

## 👥 Ruoli Utente

| Ruolo | Descrizione | Permessi |
|-------|-------------|----------|
| **Viewer** | Consulta dati | Visualizza KPI, report, commenti (sola lettura) |
| **Editor** | Gestisce forecast | Crea/modifica forecast, importa dati, gestisce commenti |
| **Approver** | Approva forecast | Tutti i permessi Editor + approvazione forecast |
| **Admin** | Amministratore | Tutti i permessi + gestione utenti e configurazioni |

## 🎨 Design System ESA

### Palette Colori
- **Blu ESA (Primario)**: `#0D3F85` - Pulsanti principali, link attivi
- **Bianco**: `#FFFFFF` - Sfondo prevalente
- **Grigio Scuro**: `#333333` - Testi, icone neutre
- **Nero**: `#000000` - Micro-tipografia
- **Rosso Prodotto**: `#C42024` - Highlight funzionali, errori

### Tipografia
- **Font**: Inter (Google Fonts)
- **Scale modulare**: 8pt grid system
- **Line height**: Ottimizzato per leggibilità

## 📱 Responsive Design

- **Desktop**: Layout completo con sidebar e pannelli
- **Tablet**: Layout card-based ottimizzato
- **Mobile**: Navigazione semplificata (future release)

## 🔒 Sicurezza

- **Row Level Security (RLS)** su tutte le tabelle
- **Policy basate sui ruoli** per controllo accessi
- **Validazione password** robusta (min 8 char, 1 maiuscola, 1 numero)
- **Audit trail** completo per compliance
- **HTTPS** obbligatorio in produzione

## 📊 Funzionalità Principali

### Dashboard
- KPI cards animate con variazioni percentuali
- Alert center per valori fuori tolleranza
- Widget azioni pendenti personalizzato per ruolo
- Ricerca globale (⌘/Ctrl + K)

### Autenticazione
- Login email/password con validazione
- Registrazione con conferma email
- Reset password via email
- Gestione sessioni automatica

### Forecast (In sviluppo)
- Foglio simile a Excel con validazione live
- Sistema commenti con mention e thread
- Import wizard per file Excel/CSV
- Color coding automatico delle celle
- Filtri salvati e preferiti

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📦 Build e Deploy

### Vercel (Raccomandato)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# Upload della cartella dist/
```

### Docker
```bash
docker build -t esa-forecast .
docker run -p 3000:3000 esa-forecast
```

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch feature (`git checkout -b feature/amazing-feature`)
3. Commit delle modifiche (`git commit -m 'Add amazing feature'`)
4. Push del branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

## 📄 Licenza

© 2024 ESA - Ecologia Soluzione Ambiente. Tutti i diritti riservati.

## 🆘 Supporto

Per supporto tecnico:
- 📧 Email: support@esa-forecast.com
- 💬 Chat in-app (disponibile nell'applicazione)
- 📞 Telefono: +39 XXX XXX XXXX

---

**Versione**: 1.0.0  
**Ultimo aggiornamento**: Novembre 2024
