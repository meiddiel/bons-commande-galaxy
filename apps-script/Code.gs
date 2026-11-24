/**
 * API Google Sheet pour la PWA « Bons de commande ».
 * À coller dans Extensions > Apps Script du classeur, puis déployer en « Application Web ».
 * Onglets attendus : Bons, Lignes, Journal (déjà créés dans le classeur).
 */

// Changez ce jeton, puis recopiez-le dans Paramètres > Jeton secret de l'application.
const TOKEN = 'CHANGEZ-MOI-galaxy-2026';

const COL_JSON = 29; // colonne AC « Données (JSON) » de l'onglet Bons

function doGet() {
  return out({ ok: true, message: 'API Bons de commande active' });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.token !== TOKEN) return out({ ok: false, error: 'Jeton invalide' });
    switch (req.action) {
      case 'ping': return out({ ok: true });
      case 'list': return out({ ok: true, bons: listBons() });
      case 'save': {
        const lock = LockService.getScriptLock();
        lock.waitLock(20000);
        try { saveBon(req.bon); } finally { lock.releaseLock(); }
        return out({ ok: true });
      }
      default: return out({ ok: false, error: 'Action inconnue' });
    }
  } catch (err) {
    return out({ ok: false, error: String(err && err.message || err) });
  }
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function sheet(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('Onglet introuvable : ' + name);
  return sh;
}

function listBons() {
  const sh = sheet('Bons');
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, COL_JSON, n - 1, 1).getValues()
    .map(r => { try { return JSON.parse(r[0]); } catch (e) { return null; } })
    .filter(Boolean);
}

// Empêche Sheets d'interpréter un texte commençant par = + - @ comme une formule.
function txt(v) {
  const s = v == null ? '' : String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function saveBon(b) {
  if (!b || !b.id) throw new Error('Bon invalide');
  const t = b.totaux || {};
  const f = b.fournisseur || {};
  const rv = b.revue || {};

  // 1. Journal : on ajoute seulement les événements pas encore envoyés
  const journal = sheet('Journal');
  const evts = (b.historique || []).filter(h => !h.s);
  if (evts.length) {
    const rows = evts.map(h => [new Date(h.date), txt(b.numero), b.version, txt(h.action), txt(h.par), txt(h.commentaire)]);
    journal.getRange(journal.getLastRow() + 1, 1, rows.length, 6).setValues(rows);
  }
  (b.historique || []).forEach(h => { h.s = 1; });
  delete b.totaux;
  const lettres = b.lettres; delete b.lettres;

  // 2. Bons : mise à jour de la ligne existante ou ajout
  const bonsSh = sheet('Bons');
  const row = [
    b.id, txt(b.numero), b.version, b.statut, b.date, b.livraison || '',
    txt(f.nom), txt(f.nif), txt(f.stat), txt(f.rcs), txt(f.adresse),
    txt(b.demandeur), txt(b.adresseLivraison), txt(b.conditions),
    t.brut || 0, t.remises || 0, t.ht || 0, t.tva || 0, t.ttc || 0,
    txt(b.avoirRef), Number(b.avoir) || 0, t.net || 0, lettres || '',
    txt(b.notes), txt(rv.commentaire), txt(rv.par), rv.date ? new Date(rv.date) : '',
    b.modifie ? new Date(b.modifie) : new Date(), JSON.stringify(b)
  ];
  const n = bonsSh.getLastRow();
  let idx = -1;
  if (n >= 2) {
    const ids = bonsSh.getRange(2, 1, n - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) if (ids[i][0] === b.id) { idx = i + 2; break; }
  }
  if (idx > 0) bonsSh.getRange(idx, 1, 1, row.length).setValues([row]);
  else bonsSh.getRange(n + 1, 1, 1, row.length).setValues([row]);

  // 3. Lignes : on remplace les lignes de ce bon
  const lignesSh = sheet('Lignes');
  const m = lignesSh.getLastRow();
  if (m >= 2) {
    const ids = lignesSh.getRange(2, 1, m - 1, 1).getValues();
    for (let i = ids.length - 1; i >= 0; i--) if (ids[i][0] === b.id) lignesSh.deleteRow(i + 2);
  }
  const lignes = (b.lignes || []).filter(l => l.designation || Number(l.qte));
  if (lignes.length) {
    const rows = lignes.map((l, i) => {
      const qte = Number(l.qte) || 0, pu = Number(l.pu) || 0, rem = Number(l.remise) || 0;
      return [b.id, txt(b.numero), b.version, i + 1, txt(l.code), txt(l.designation), txt(l.unite), qte, pu, rem / 100, Math.round(qte * pu * (1 - rem / 100))];
    });
    const start = lignesSh.getLastRow() + 1;
    lignesSh.getRange(start, 1, rows.length, 11).setValues(rows);
    lignesSh.getRange(start, 10, rows.length, 1).setNumberFormat('0%');
  }
}
