/**
 * KmC — Manuale d'uso
 * Pagina stampabile accessibile da /manuale
 */

export default function ManualePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 text-gray-800 print:py-4">

      {/* ── Copertina ────────────────────────────────────────────── */}
      <div className="mb-10 pb-8 border-b border-gray-200">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">
          Manuale d'uso · v1.0
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-1">KmC</h1>
        <p className="text-lg text-gray-500 font-medium mb-4">Distance Check</p>
        <p className="text-sm text-gray-600 leading-relaxed max-w-xl">
          KmC è un'applicazione web che consente di caricare un file Excel contenente
          spedizioni, geocodificare automaticamente gli indirizzi dei destinatari tramite
          OpenStreetMap e calcolare la distanza stradale reale tra il punto di sparo
          (palmare) e il destinatario, esportando i risultati in un nuovo file Excel
          corredato di link Google Maps per ogni riga.
        </p>
      </div>

      {/* ── Indice ───────────────────────────────────────────────── */}
      <div className="mb-10 p-5 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Indice</p>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Caricamento del file Excel</li>
          <li>Selezione del foglio di lavoro</li>
          <li>Riconoscimento automatico delle colonne</li>
          <li>Geocoding degli indirizzi</li>
          <li>Calcolo delle distanze stradali</li>
          <li>Interpretazione dei risultati</li>
          <li>Export Excel con link Maps</li>
          <li>Avvertenze e limitazioni</li>
        </ol>
      </div>

      {/* ── Sezioni ──────────────────────────────────────────────── */}
      <div className="space-y-10">

        {/* 1 */}
        <section>
          <SectionTitle n="1" title="Caricamento del file Excel" />
          <p className="text-sm leading-relaxed text-gray-700">
            Nella schermata principale trascinare il file Excel (<code>.xlsx</code> o <code>.xls</code>)
            nell'area tratteggiata, oppure fare clic su <strong>"clicca per sfogliare"</strong> per
            selezionarlo dalla cartella. L'app supporta file di qualsiasi dimensione, ma tempi di
            elaborazione più lunghi si verificheranno con file superiori a 500 righe.
          </p>
          <Note>
            Non ricaricare la pagina durante l'elaborazione: il processo verrebbe interrotto
            e tutti i progressi andrebbero persi.
          </Note>
        </section>

        {/* 2 */}
        <section>
          <SectionTitle n="2" title="Selezione del foglio di lavoro" />
          <p className="text-sm leading-relaxed text-gray-700">
            Dopo il caricamento, l'app rileva automaticamente tutti i fogli presenti nel file.
            Se esiste un foglio denominato <code>DB DATI</code> viene pre-selezionato.
            È possibile cambiare foglio tramite il selettore a tendina. Ogni cambio di foglio
            aggiorna automaticamente l'anteprima e il riconoscimento delle colonne.
          </p>
        </section>

        {/* 3 */}
        <section>
          <SectionTitle n="3" title="Riconoscimento automatico delle colonne" />
          <p className="text-sm leading-relaxed text-gray-700 mb-3">
            L'app analizza le intestazioni del foglio e tenta di abbinare automaticamente
            le colonne ai campi necessari per il geocoding. Le colonne riconosciute sono:
          </p>
          <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-3 py-2 text-left font-semibold">Campo</th>
                <th className="px-3 py-2 text-left font-semibold">Descrizione</th>
                <th className="px-3 py-2 text-left font-semibold">Obbligatorio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Indirizzo', 'Via/Piazza del destinatario', 'Sì'],
                ['CAP', 'Codice di avviamento postale', 'Sì'],
                ['Città', 'Comune del destinatario', 'Sì'],
                ['Numero civico', 'Numero civico (se separato)', 'No'],
                ['Provincia', 'Sigla provincia', 'No'],
                ['Lat. SPARO', 'Latitudine del punto di sparo/palmare', 'No *'],
                ['Lng. SPARO', 'Longitudine del punto di sparo/palmare', 'No *'],
              ].map(([campo, desc, obbl]) => (
                <tr key={campo} className="even:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-gray-800">{campo}</td>
                  <td className="px-3 py-2 text-gray-600">{desc}</td>
                  <td className={`px-3 py-2 font-semibold ${obbl === 'Sì' ? 'text-blue-700' : 'text-gray-400'}`}>{obbl}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-500 mt-2">
            * Le coordinate SPARO non sono obbligatorie per il geocoding, ma sono necessarie
            per il calcolo della distanza. Se assenti, la colonna distanza mostrerà <code>NO SPARO</code>.
          </p>
        </section>

        {/* 4 */}
        <section>
          <SectionTitle n="4" title="Geocoding degli indirizzi" />
          <p className="text-sm leading-relaxed text-gray-700 mb-3">
            Dopo aver verificato il mapping delle colonne, premere il pulsante{' '}
            <strong>"Geocodifica Indirizzi"</strong>. L'app invia ogni indirizzo al servizio
            Nominatim di OpenStreetMap e ne ricava le coordinate GPS (latitudine e longitudine).
          </p>
          <p className="text-sm leading-relaxed text-gray-700 mb-3">
            Per ogni indirizzo il sistema esegue fino a <strong>tre strategie</strong> di ricerca:
          </p>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside mb-3">
            <li>Ricerca con indirizzo completo (via + CAP + città + provincia)</li>
            <li>Ricerca semplificata (solo via + CAP + città)</li>
            <li>Ricerca solo per città e CAP (fallback)</li>
          </ol>
          <p className="text-sm leading-relaxed text-gray-700">
            Se vengono trovati più candidati con bassa confidenza, appare un <strong>popup</strong>{' '}
            che mostra le opzioni disponibili: l'utente può selezionare quella corretta o
            saltare la riga.
          </p>
          <Note>
            Nominatim impone un limite di <strong>1 richiesta al secondo</strong>. Per 1.000 indirizzi
            il tempo di attesa è circa 16–18 minuti. In caso di errori temporanei il sistema
            riprova automaticamente fino a 3 volte con attesa progressiva.
          </Note>
        </section>

        {/* 5 */}
        <section>
          <SectionTitle n="5" title="Calcolo delle distanze stradali" />
          <p className="text-sm leading-relaxed text-gray-700">
            Per ogni riga geocodificata con successo, l'app calcola la distanza stradale
            reale (in km) tra il punto di sparo/palmare e il domicilio del destinatario
            utilizzando <strong>OSRM</strong> (Open Source Routing Machine), un motore
            di instradamento basato su OpenStreetMap. La distanza è calcolata come
            percorso stradale effettivo in modalità guida, non in linea d'aria.
          </p>
        </section>

        {/* 6 */}
        <section>
          <SectionTitle n="6" title="Interpretazione dei risultati" />
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            Nella tabella dei risultati e nell'export Excel, ogni riga è colorata in base
            alla distanza calcolata:
          </p>
          <div className="space-y-2 mb-4">
            <ColorRow color="bg-green-100 border-green-300" label="Verde" desc="Distanza ≤ 400 m dal punto di sparo — consegna raggiungibile a piedi" />
            <ColorRow color="bg-red-100 border-red-300" label="Rosso" desc="Distanza > 400 m dal punto di sparo — consegna distante" />
            <ColorRow color="bg-orange-100 border-orange-300" label="Arancione" desc="Indirizzo non geocodificato o dati insufficienti" />
          </div>
          <p className="text-sm leading-relaxed text-gray-700 mb-3">
            Nella colonna <strong>Distanza SPARO</strong> possono comparire i seguenti messaggi:
          </p>
          <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="px-3 py-2 text-left font-semibold">Valore</th>
                <th className="px-3 py-2 text-left font-semibold">Significato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-3 py-2 font-mono font-bold text-blue-700">2.340</td>
                <td className="px-3 py-2 text-gray-600">Distanza in km calcolata correttamente</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-3 py-2 font-mono font-bold text-red-600">NO LAT/LONG IND.</td>
                <td className="px-3 py-2 text-gray-600">L'indirizzo del destinatario non è stato trovato su OpenStreetMap</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono font-bold text-amber-600">NO SPARO</td>
                <td className="px-3 py-2 text-gray-600">Indirizzo geocodificato ma mancano le coordinate del punto di sparo nella riga</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 7 */}
        <section>
          <SectionTitle n="7" title="Export Excel con link Maps" />
          <p className="text-sm leading-relaxed text-gray-700 mb-3">
            Al termine dell'elaborazione premere <strong>"Esporta Excel"</strong>. Il file
            scaricato (<code>KmC_risultati.xlsx</code>) contiene tutte le colonne originali
            del file caricato più cinque colonne aggiuntive:
          </p>
          <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-3 py-2 text-left font-semibold">Colonna</th>
                <th className="px-3 py-2 text-left font-semibold">Contenuto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Lat (geocodificata)', 'Latitudine del domicilio destinatario (6 decimali)'],
                ['Lng (geocodificata)', 'Longitudine del domicilio destinatario (6 decimali)'],
                ['Distanza SPARO (km)', 'Distanza stradale in km con 3 decimali'],
                ['Stato geocoding', 'success / failed / skipped / cached'],
                ['Link Percorso Maps', 'Link cliccabile che apre Google Maps con il percorso da SPARO a destinatario'],
              ].map(([col, desc]) => (
                <tr key={col} className="even:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-gray-800">{col}</td>
                  <td className="px-3 py-2 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm leading-relaxed text-gray-700 mt-3">
            Il file include anche un foglio <strong>Legenda</strong> con il significato dei colori.
            I link Maps si aprono nel browser e mostrano il percorso stradale diretto senza
            richiedere account Google o API key.
          </p>
        </section>

        {/* 8 */}
        <section>
          <SectionTitle n="8" title="Avvertenze e limitazioni" />
          <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
            <li>
              <strong>Non chiudere il browser</strong> durante l'elaborazione: il processo
              è client-side e non può essere ripreso.
            </li>
            <li>
              <strong>Qualità degli indirizzi:</strong> OpenStreetMap ha copertura eccellente in Italia
              ma alcuni indirizzi rurali o recenti potrebbero non essere trovati. In quel caso
              la riga viene marcata come <code>failed</code> e colorata in arancione.
            </li>
            <li>
              <strong>Uso non commerciale:</strong> i servizi Nominatim e OSRM pubblici sono gratuiti
              per uso non commerciale. L'utilizzo interno aziendale non a scopo di rivendita
              rientra in questa categoria.
            </li>
            <li>
              <strong>Retry automatico:</strong> in caso di errori temporanei (rete, sovraccarico
              del server) il sistema riprova automaticamente fino a 3 volte con attesa crescente
              prima di segnare una riga come errore.
            </li>
            <li>
              <strong>Cache:</strong> gli indirizzi già geocodificati in precedenti sessioni vengono
              riutilizzati automaticamente (stato <code>cached</code>), risparmiando tempo nelle
              elaborazioni successive con gli stessi dati.
            </li>
          </ul>
        </section>

      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="mt-14 pt-6 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
        <span>KmC — Distance Check</span>
        <span>Tecnologie: OpenStreetMap · Nominatim · OSRM · Next.js · Vercel</span>
      </div>

      {/* Stile stampa */}
      <style>{`
        @media print {
          body { background: white !important; }
          body::after { display: none !important; }
          header { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Componenti interni ────────────────────────────────────────────────────────

function SectionTitle({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {n}
      </span>
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <span className="text-amber-500 text-sm mt-0.5">⚠</span>
      <p className="text-xs text-amber-800 leading-relaxed">{children}</p>
    </div>
  );
}

function ColorRow({ color, label, desc }: { color: string; label: string; desc: string }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${color}`}>
      <span className="text-xs font-bold text-gray-700 w-16 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-600">{desc}</span>
    </div>
  );
}
