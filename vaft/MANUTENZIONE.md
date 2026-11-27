# Analisi e manutenzione di VAFT

La base è il commit `c51ef2f` di `pixeltris/TwitchAdSolutions`, archiviato il 5 marzo 2026. L'ultima modifica allo scriptlet è `f8f8670`, del 28 febbraio 2026. La licenza e l'attribuzione sono nel file `LICENSE`. [Commit di partenza](https://github.com/pixeltris/TwitchAdSolutions/commit/c51ef2fe8f667f9dc9216eb550924cf0d732ce27) · [Ultima modifica allo scriptlet](https://github.com/pixeltris/TwitchAdSolutions/commit/f8f86706daf90daa534b26bce5b2f01238667d5f)

## Percorso del codice

| Punto di ingresso | Ruolo |
| --- | --- |
| `hookWindowWorker` | Installa un wrapper per `Worker` nella pagina e compone il sorgente eseguito nel worker del player. |
| `hookWorkerFetch` | Intercetta richieste del worker. Distingue le playlist master, che elencano le varianti disponibili, dalle playlist media, che elencano i segmenti. |
| `processM3U8` e `stripAdSegments` | Interpretano la playlist media e gestiscono lo stato pubblicitario e il fallback. |
| `hookFetch` | Osserva le richieste della pagina e sincronizza i metadati di sessione con i worker. |
| `getPlayerAndState`, `monitorPlayerBuffering` e `doTwitchPlayerTask` | Usano internals del player per rilevare stalli, riprendere la riproduzione o ricaricare. |

Lo scriptlet uBlock Origin inizia con l'intestazione della risorsa. Il file `.user.js` ha invece i metadati per il gestore userscript. Il corpo a monte coincide dopo la rimozione delle intestazioni e del controllo iniziale dell'hostname dello scriptlet. Per analizzare la baseline con REA, è stata creata una copia del solo JavaScript senza la prima riga dello scriptlet. La lettura del sorgente e i test eseguiti sul worker generato confermano i percorsi descritti qui. [Sorgente originale](https://github.com/pixeltris/TwitchAdSolutions/blob/c51ef2fe8f667f9dc9216eb550924cf0d732ce27/vaft/vaft-ublock-origin.js)

## Correzione verificata

Il precedente wrapper di `fetch` avviava un'elaborazione asincrona senza collegarne il risultato alla promessa restituita al player. Se il parser generava un errore dopo una risposta HTTP 200, la promessa del player rimaneva in sospeso. Due esempi riprodotti sono un tag `SERVER-TIME` assente e una playlist con una variante priva di `CODECS`. Le specifiche HLS raccomandano `CODECS` per `EXT-X-STREAM-INF`. [RFC 8216, sezione 4.3.4.2](https://www.rfc-editor.org/rfc/rfc8216.html#section-4.3.4.2)

Il wrapper ora attende il risultato del parsing. Se l'elaborazione fallisce, restituisce la risposta originale ancora leggibile. Le varianti con codec sconosciuto restano nella playlist e le nuove mappature master vengono registrate dopo il parsing. I test simulano rete e worker e coprono entrambe le distribuzioni.

## Qualità durante gli annunci

Durante il caricamento VAFT prova i profili in ordine `embed`, `popout`, `autoplay`, con un tentativo per profilo nei primi 1,5 secondi. Se trova una playlist pulita alla qualità già usata dal player, la seleziona subito. Se trova solo una qualità inferiore, la tiene disponibile e cerca di meglio nei profili rimanenti. La 360p resta un ripiego.

Per ogni playlist master, `getStreamForResolution` considera le varianti entro risoluzione e frame rate correnti quando questi dati sono disponibili. Scarta le famiglie di codec incompatibili note e ordina le altre varianti per risoluzione, frame rate e banda dichiarata. Il log riporta il profilo e la variante effettivamente scelti, per esempio `Blocking midroll ads (popout, 1920x1080 @ 60 fps)`.

## Aggiornamenti futuri

### Diagnostica

- `[VAFT] page hooks installed` e `hookWorkerFetch (vaft)` riportano la build nel contesto della pagina e in quello del worker del player.
- `Blocking ads` riporta la variante selezionata, la qualità di partenza (`target` e `targetFps`), quanti profili sono stati considerati (`profiles`) e il tempo di selezione (`elapsedMs`). `reason` distingue qualità corrispondente (`matched-quality`), qualità inferiore (`lower-quality`), profilo di ripiego (`fallback-profile`) e playlist originale (`no-usable-variant`).
- `master cache refresh` indica che VAFT ricostruisce la cache partendo dalla playlist master appena ricevuta. Il controllo usa l'URL già letto dalla playlist, compresi i parametri. Se quel controllo fallisce, il log indica il codice HTTP o il tipo di errore.
- `original playlist returned` distingue playlist master e media e indica se il problema è avvenuto durante lettura (`read`) o elaborazione (`process`). Queste righe evitano URL, token e messaggi grezzi di eccezione.
- Da `37.0.2`, `Finished blocking ads [VAFT] resume=direct` indica che VAFT restituisce la playlist originale e lascia al player la ripresa. Se VAFT aveva attivato una playlist master modificata, ripristina l'originale e richiede una ricarica (`resume=reload reason=modified-master`). `ReloadPlayerAfterAd` può forzare la ricarica per un test (`reason=configured-reload`). Il monitor del buffering continua a intervenire in caso di stallo.
- Nella build diagnostica `37.0.3`, `ad return timeline` confronta l'ultima playlist alternativa inviata al player e la prima playlist live restituita al rientro diretto. Riporta i numeri di sequenza, la sovrapposizione delle finestre (`overlapMs`) e lo spostamento della fine della finestra (`edgeDeltaMs`). Se i timestamp mancano o risultano discontinui, le differenze temporali risultano `unknown`. `ad return playback` osserva l'orologio del video per cinque secondi dopo la richiesta di rientro e riporta salti indietro, seek e attese. I due messaggi riportano misure locali e non includono manifest, URL, token o dati del canale.
- Nella build di prova `37.0.4` il limite per cercare una playlist alternativa è di 2,5 secondi. Una volta trovata una variante senza il marcatore pubblicitario, la ricerca di qualità migliore dispone al massimo di altri 350 ms, entro il limite totale. `deadline=true` indica che VAFT ha interrotto la ricerca e restituito la migliore risposta già disponibile o ripreso la gestione della playlist originale. `ReloadPlayerAfterAd` rimane come opzione di recupero nella configurazione dello script.

Lo stress test `node vaft/test/simulate-throughput.cjs` confronta bitrate costanti su tracce sintetiche di connessione. Simula il download di 15 segmenti di due secondi, già disponibili, con quattro secondi di buffer iniziale. Il modello misura l'effetto della banda sul buffer. La suite delle playlist verifica invece decisioni e annullamento delle richieste con risposte lente o fallite. Il tempo per scaricare un manifest non è una stima del bitrate video sostenibile.

### Ordine delle playlist nella 37.0.5 sperimentale

Il worker numera i poll video prima del fetch. Una risposta più recente può cancellare la ricerca di riserva superata e, per la stessa variante, fornire il risultato corrente anche al poll precedente. Poll sovrapposti con annunci sulla stessa variante condividono una sola ricerca. Una nuova sessione del canale invalida le operazioni rimaste aperte. [xBandaku #17](https://github.com/xBandaku/TwitchAdSolutions/pull/17)

Durante la stessa interruzione il worker può riprovare in anticipo un profilo HD già confermato. La prova legge la variante dalla master in cache e ha al massimo 350 ms all'interno del limite complessivo di 2,5 secondi. Se la riserva rallenta, la ricerca prosegue nell'ordine normale. [Helli24 #33](https://github.com/Helli24/TwitchAdSolutions/pull/33)

### Flusso di prova e rilascio

1. Registra il sintomo e la versione in uso. Se mancano i messaggi del worker, parti dall'iniezione dello script. Se manca una qualità o una playlist si blocca, parti dal ramo master. Se il player resta in buffering a playlist valida, parti dal monitor del player.
2. Riproduci il problema con una fixture sintetica. Aggiorna i due formati VAFT e controlla dalla radice del repo con Node.js 24.

   ```powershell
   node --test vaft/test/playlist.test.cjs
   ```

3. Apri una pull request verso `main` nella repository di Free Adv Twitch Script. Il workflow `VAFT offline tests` esegue gli stessi controlli in GitHub Actions. Verifica anche l'iniezione e la riproduzione in un profilo browser di prova prima del merge.
4. Allinea `@version` e il valore di `vaftBuild` in entrambi i file. Dopo i controlli, crea manualmente una bozza di release GitHub per il tag corrispondente, per esempio `v37.0.1`, e verifica che punti al commit collaudato. Aggiungi alle note i link Raw fissati a quel commit per entrambi gli script. Lo userscript usa `@downloadURL none` per mantenere il passaggio alla versione successiva manuale. [Release di GitHub](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)

Il collaudo di questa patch è offline. La compatibilità con il player Twitch attuale richiede una verifica nel browser.
