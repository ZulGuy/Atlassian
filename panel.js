(function () {
  var BASE = 'https://frostborne1.atlassian.net';
  var q = document.getElementById('q');
  var link = document.getElementById('go');
  var out = document.getElementById('log');

  function log() {
    var line = Array.prototype.slice.call(arguments).map(function (a) {
      if (typeof a === 'string') return a;
      try { return JSON.stringify(a); } catch (e) { return String(a); }
    }).join(' ');
    console.log('[panel]', line);
    out.textContent += line + '\n';
  }

  function searchUrl() { return BASE + '/wiki/search?text=' + encodeURIComponent(q.value); }
  function upd() { link.href = searchUrl(); }
  function parse(r) {
    if (typeof r === 'string') { try { return JSON.parse(r); } catch (e) {} }
    return r;
  }
  function safe(label, fn) {
    try { fn(); } catch (e) { log(label + ' threw:', e && e.message ? e.message : String(e)); }
  }

  q.addEventListener('input', upd);
  upd();

  // 1. Environment checks
  log('--- environment ---');
  log('typeof AP:', typeof window.AP);
  log('typeof AdaptavistBridge:', typeof window.AdaptavistBridge);
  log('typeof AdaptavistBridgeContext:', typeof window.AdaptavistBridgeContext);
  safe('bridge keys', function () { log('AdaptavistBridge keys:', Object.keys(window.AdaptavistBridge || {})); });
  safe('context keys', function () { log('AdaptavistBridgeContext keys:', Object.keys(window.AdaptavistBridgeContext || {})); });
  safe('AP keys', function () { if (window.AP) log('AP keys:', Object.keys(window.AP)); });
  safe('parent bridge', function () { log('typeof parent.__bridge:', typeof window.parent.__bridge); });
  log('location.origin:', location.origin, '| sandboxed frame:', window.self !== window.top);

  // 2. Context and summary
  log('--- context ---');
  var ctx = null;
  safe('context', function () {
    ctx = window.AdaptavistBridgeContext && window.AdaptavistBridgeContext.context;
    log('context:', ctx);
  });

  var key = ctx && ctx.issueKey;
  if (key && window.AdaptavistBridge && window.AdaptavistBridge.request) {
    safe('summary request', function () {
      Promise.resolve(window.AdaptavistBridge.request({
        url: '/rest/api/2/issue/' + encodeURIComponent(key) + '?fields=summary',
        type: 'GET'
      })).then(function (res) {
        var data = parse(res);
        var summary = data && data.fields && data.fields.summary;
        log('summary:', summary);
        if (summary) { q.value = summary; upd(); }
      }).catch(function (e) {
        log('summary request failed:', e);
      });
    });
  } else {
    log('no issueKey or no bridge.request, summary skipped');
  }

  // 3. Manual tests (buttons)
  document.getElementById('t-conf').addEventListener('click', function () {
    log('--- test: Confluence REST via bridge ---');
    safe('confluence', function () {
      Promise.resolve(window.AdaptavistBridge.request({
        url: '/wiki/rest/api/search?cql=' + encodeURIComponent('text ~ "' + (q.value || 'test').replace(/"/g, '') + '"') + '&limit=3',
        type: 'GET'
      })).then(function (res) {
        var data = parse(res);
        log('confluence OK, results:', data && data.results ? data.results.length : data);
      }).catch(function (e) {
        log('confluence request failed:', e);
      });
    });
  });

  document.getElementById('t-ap').addEventListener('click', function () {
    log('--- test: AP.navigator ---');
    safe('AP.navigator absoluteUrl', function () {
      window.AP.navigator.go('site', { absoluteUrl: searchUrl() });
      log('absoluteUrl call sent');
    });
    safe('AP.navigator relativeUrl', function () {
      window.AP.navigator.go('site', { relativeUrl: '/wiki/search?text=' + encodeURIComponent(q.value) });
      log('relativeUrl call sent');
    });
  });

  document.getElementById('t-open').addEventListener('click', function () {
    log('--- test: window.open / top navigation ---');
    safe('window.open', function () {
      var w = window.open(searchUrl(), '_blank');
      log('window.open returned:', w ? 'window' : 'null (blocked)');
    });
    safe('top navigation', function () {
      window.top.location.href = searchUrl();
      log('top navigation sent');
    });
  });
setTimeout(function () {
    log('--- delayed check (2s) ---');
    log('typeof AdaptavistBridge:', typeof window.AdaptavistBridge);
    safe('window keys', function () {
      var keys = Object.keys(window).filter(function (k) { return /bridge|adaptavist|forge|AP$/i.test(k); });
      log('matching window keys:', keys);
    });
    safe('parent bridge keys', function () {
      var b = window.parent.__bridge;
      log('parent.__bridge keys:', Object.keys(b));
      log('typeof callBridge:', typeof b.callBridge);
    });
  }, 2000);

    var variants = [
    ['navigate', function () { return { target: 'url', url: searchUrl() }; }],
    ['navigate', function () { return { url: searchUrl() }; }],
    ['navigate', function () { return { target: '_self', url: searchUrl() }; }],
    ['open', function () { return searchUrl(); }],
    ['open', function () { return { url: searchUrl() }; }]
  ];

  document.getElementById('t-run').addEventListener('click', function () {
    var v = variants[document.getElementById('variant').value];
    var payload = v[1]();
    log('--- callBridge', v[0], JSON.stringify(payload), '---');
    safe('callBridge', function () {
      var r = window.parent.__bridge.callBridge(v[0], payload);
      if (r && r.then) {
        r.then(function (x) { log('resolved:', x); })
         .catch(function (e) { log('rejected:', e && e.message ? e.message : e); });
      } else { log('returned:', r); }
    });
  });

  document.getElementById('t-sum').addEventListener('click', function () {
    var key = window.AdaptavistBridgeContext.context.issueKey;
    log('--- callBridge fetchProduct (guess) ---');
    safe('fetchProduct', function () {
      var r = window.parent.__bridge.callBridge('fetchProduct', {
        product: 'jira',
        restPath: '/rest/api/3/issue/' + key + '?fields=summary',
        fetchRequestInit: { method: 'GET' }
      });
      Promise.resolve(r)
        .then(function (x) { log('fetchProduct resolved:', x); })
        .catch(function (e) { log('fetchProduct rejected:', e && e.message ? e.message : e); });
    });
  });
})();