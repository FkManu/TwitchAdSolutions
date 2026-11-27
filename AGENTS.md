# Manutenzione di VAFT

- Per le modifiche a VAFT, parti dal sintomo e indica il file e la funzione che lo spiegano. Distingui i risultati dell'analisi statica, quelli dei test e quelli eventualmente osservati nel browser.
- Mantieni allineata la logica comune in `vaft/vaft-ublock-origin.js` e `vaft/vaft.user.js`. Rispetta l'intestazione di ciascun formato e il controllo dell'hostname dello scriptlet.
- Riproduci i problemi di parsing con playlist sintetiche e dipendenze di rete simulate. Copri entrambi gli entry point quando modifichi la logica condivisa.
- Verifica da radice con `node --test vaft/test/playlist.test.cjs`. Per la mappa del codice e il flusso di rilascio, consulta `vaft/MANUTENZIONE.md`.
