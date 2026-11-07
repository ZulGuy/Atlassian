var q = document.getElementById('q');
var link = document.getElementById('go');
var base = 'https://frostborne1.atlassian.net/wiki/search?text=';

function upd() { link.href = base + encodeURIComponent(q.value); }
q.addEventListener('input', upd);

var key = AdaptavistBridgeContext.context.issueKey;
console.log('context:', AdaptavistBridgeContext.context);

AdaptavistBridge.request({ url: '/rest/api/2/issue/' + key + '?fields=summary', type: 'GET' })
  .then(function (issue) {
    q.value = issue.fields.summary;
    upd();
  })
  .catch(function (e) { console.log('request failed', e); });
console.log('AdaptavistBridge keys:', Object.keys(window.AdaptavistBridge || {}));
console.log('Context keys:', Object.keys(window.AdaptavistBridgeContext || {}));
console.log('forge bridge in parent:', typeof window.parent.__bridge);