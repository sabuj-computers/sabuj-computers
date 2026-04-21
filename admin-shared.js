/* ============================================================
 * SCTC Admin Shared Module — Single source of truth
 * Used by: attendance-admin.html, employee-attendance-admin.html,
 *          admin-dashboard.html
 * Provides:
 *   - SctcToast.show(msg, opts)            → bottom-right toast
 *   - SctcAudit.log(action, target, data)  → write to sabuj/audit-log
 *   - SctcAudit.streamRecent(cb, limit)    → live audit feed
 *   - SctcDelete.withUndo(opts)            → confirm → delete → 5s undo toast
 *   - SctcDelete.range(refPath, from, to)  → date-range bulk delete
 *   - SctcSelect.create(name)              → checkbox selection tracker
 *   - SctcImage.preload(url)               → CORS-safe image preload
 * ============================================================ */
(function (global) {
  'use strict';

  // ---------- Toast ----------
  function ensureToastRoot() {
    var root = document.getElementById('sctc-toast-root');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'sctc-toast-root';
    root.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:360px;font-family:"Hind Siliguri",sans-serif;';
    document.body.appendChild(root);
    return root;
  }

  function toast(message, opts) {
    opts = opts || {};
    var root = ensureToastRoot();
    var box = document.createElement('div');
    var bg = opts.variant === 'danger' ? 'linear-gradient(135deg,#7f1d1d,#dc2626)'
           : opts.variant === 'success' ? 'linear-gradient(135deg,#0d3d1f,#16a34a)'
           : opts.variant === 'warn' ? 'linear-gradient(135deg,#78350f,#d97706)'
           : 'linear-gradient(135deg,#0f172a,#1e293b)';
    box.style.cssText = 'background:'+bg+';color:#fff;padding:12px 14px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.4);font-size:13px;line-height:1.5;border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;gap:10px;animation:sctcToastIn .25s ease-out;';
    var msg = document.createElement('div');
    msg.style.flex = '1';
    msg.innerHTML = message;
    box.appendChild(msg);
    if (opts.actionLabel && typeof opts.onAction === 'function') {
      var btn = document.createElement('button');
      btn.textContent = opts.actionLabel;
      btn.style.cssText = 'background:rgba(255,255,255,0.18);color:#fff;border:1px solid rgba(255,255,255,0.25);padding:6px 12px;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit;font-size:12px;';
      btn.onclick = function () { try { opts.onAction(); } catch(e){} dismiss(); };
      box.appendChild(btn);
    }
    root.appendChild(box);
    var timeout = opts.duration || 4000;
    var timer = setTimeout(dismiss, timeout);
    function dismiss() {
      clearTimeout(timer);
      box.style.transition = 'opacity .2s, transform .2s';
      box.style.opacity = '0';
      box.style.transform = 'translateX(20px)';
      setTimeout(function(){ box.remove(); }, 220);
    }
    return { dismiss: dismiss };
  }

  // Inject one-time keyframes
  if (!document.getElementById('sctc-toast-style')) {
    var st = document.createElement('style');
    st.id = 'sctc-toast-style';
    st.textContent = '@keyframes sctcToastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(st);
  }

  // ---------- Audit log ----------
  function getDb() {
    if (global.firebase && firebase.database) return firebase.database();
    return null;
  }
  function currentActor() {
    try {
      var u = firebase.auth().currentUser;
      return u ? (u.email || u.uid) : 'unknown';
    } catch (e) { return 'unknown'; }
  }

  function auditLog(action, target, data) {
    var db = getDb();
    if (!db) return Promise.resolve();
    var entry = {
      action: action || 'unknown',
      target: target || '',
      data: data || null,
      actor: currentActor(),
      at: firebase.database.ServerValue.TIMESTAMP,
      page: location.pathname.split('/').pop() || 'admin'
    };
    return db.ref('sabuj/audit-log').push(entry).catch(function(){});
  }

  function streamRecentAudit(callback, limit) {
    var db = getDb();
    if (!db) return function(){};
    var ref = db.ref('sabuj/audit-log').limitToLast(limit || 200);
    var handler = function(snap) {
      var data = snap.val() || {};
      var arr = Object.entries(data).map(function(e){ return Object.assign({ id:e[0] }, e[1]); });
      arr.sort(function(a,b){ return (b.at||0) - (a.at||0); });
      callback(arr);
    };
    ref.on('value', handler);
    return function(){ ref.off('value', handler); };
  }

  // ---------- Delete with Undo ----------
  // opts = { refPath, label, beforeText, onAfterDelete, auditAction, auditTarget }
  function deleteWithUndo(opts) {
    if (!opts || !opts.refPath) return;
    var db = getDb(); if (!db) return;
    var ref = db.ref(opts.refPath);
    if (!confirm(opts.confirmText || ('🗑️ "' + (opts.label||'রেকর্ড') + '" মুছবেন?'))) return;
    ref.once('value').then(function(snap) {
      var snapshot = snap.val();
      if (snapshot === null) { toast('❌ রেকর্ড পাওয়া যায়নি', { variant:'danger' }); return; }
      ref.remove().then(function() {
        auditLog(opts.auditAction || 'delete', opts.auditTarget || opts.refPath, { label: opts.label||'', snapshot: snapshot });
        toast('🗑️ "' + (opts.label||'রেকর্ড') + '" মুছে ফেলা হয়েছে', {
          variant: 'success',
          duration: 5500,
          actionLabel: '↶ ফেরত আনুন',
          onAction: function() {
            ref.set(snapshot).then(function() {
              auditLog('restore', opts.auditTarget || opts.refPath, { label: opts.label||'' });
              toast('✅ পুনরুদ্ধার হয়েছে', { variant:'success', duration:2500 });
              if (typeof opts.onAfterRestore === 'function') opts.onAfterRestore();
            }).catch(function(e){ toast('❌ '+e.message, { variant:'danger' }); });
          }
        });
        if (typeof opts.onAfterDelete === 'function') opts.onAfterDelete();
      }).catch(function(e){ toast('❌ '+e.message, { variant:'danger' }); });
    });
  }

  // ---------- Date-range bulk delete ----------
  // basePath = e.g. 'sabuj/attendance-records'  (children keyed by YYYY-MM-DD)
  function deleteDateRange(basePath, fromDate, toDate, onProgress) {
    var db = getDb(); if (!db) return Promise.reject(new Error('No DB'));
    if (!fromDate || !toDate) return Promise.reject(new Error('তারিখ আবশ্যক'));
    if (fromDate > toDate) { var t = fromDate; fromDate = toDate; toDate = t; }
    var dates = [];
    var d = new Date(fromDate);
    var end = new Date(toDate);
    while (d <= end) {
      dates.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));
      d.setDate(d.getDate()+1);
    }
    var deletedCount = 0;
    var snapshot = {};
    return Promise.all(dates.map(function(dk){
      return db.ref(basePath+'/'+dk).once('value').then(function(s){
        var v = s.val();
        if (v) { snapshot[dk] = v; deletedCount += Object.keys(v).length; return db.ref(basePath+'/'+dk).remove(); }
      });
    })).then(function(){
      auditLog('bulk-delete-range', basePath, { from:fromDate, to:toDate, count:deletedCount, snapshot:snapshot });
      if (typeof onProgress === 'function') onProgress(deletedCount);
      // Offer undo
      toast('🗑️ '+deletedCount+'টি রেকর্ড মুছেছে ('+fromDate+' → '+toDate+')', {
        variant:'success', duration:7000,
        actionLabel:'↶ সব ফেরত আনুন',
        onAction: function() {
          var updates = {};
          Object.keys(snapshot).forEach(function(dk){ updates[basePath+'/'+dk] = snapshot[dk]; });
          db.ref().update(updates).then(function(){
            auditLog('bulk-restore', basePath, { from:fromDate, to:toDate, count:deletedCount });
            toast('✅ '+deletedCount+'টি রেকর্ড পুনরুদ্ধার', { variant:'success' });
          });
        }
      });
      return deletedCount;
    });
  }

  // ---------- Selection tracker ----------
  function createSelection(name) {
    var set = new Set();
    return {
      name: name,
      has: function(k){ return set.has(k); },
      toggle: function(k){ if (set.has(k)) set.delete(k); else set.add(k); },
      add: function(k){ set.add(k); },
      clear: function(){ set.clear(); },
      values: function(){ return Array.from(set); },
      size: function(){ return set.size; }
    };
  }

  // ---------- CORS-safe image preload (avoid tainted canvas) ----------
  var imgCache = {};
  function preloadImage(url) {
    if (!url) return Promise.resolve(null);
    if (imgCache[url]) return imgCache[url];
    imgCache[url] = new Promise(function(resolve){
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function(){ resolve(img); };
      img.onerror = function(){ resolve(null); };
      img.src = url;
    });
    return imgCache[url];
  }

  // ---------- Expose ----------
  global.SctcToast = { show: toast };
  global.SctcAudit = { log: auditLog, streamRecent: streamRecentAudit };
  global.SctcDelete = { withUndo: deleteWithUndo, range: deleteDateRange };
  global.SctcSelect = { create: createSelection };
  global.SctcImage = { preload: preloadImage };
})(window);
