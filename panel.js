var base = 'https://frostborne1.atlassian.net/wiki/search?text=';
var q = document.getElementById('q');
var link = document.getElementById('go');

function upd() { link.href = base + encodeURIComponent(q.value); }
q.addEventListener('input', upd);
upd();

console.log('typeof AP:', typeof AP);
try {
  AP.context.getContext(function (ctx) {
    console.log('context:', JSON.stringify(ctx));
    var key = ctx && ctx.jira && ctx.jira.issue && ctx.jira.issue.key;
    if (!key) return;
    AP.request('/rest/api/3/issue/' + key + '?fields=summary', {
      success: function (res) { q.value = JSON.parse(res).fields.summary; upd(); },
      error: function (e) { console.log('request failed', e); }
    });
  });
} catch (e) { console.log('AP not available:', e.message); }