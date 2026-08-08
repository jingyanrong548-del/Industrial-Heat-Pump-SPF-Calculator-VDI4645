/**
 * Open Thermal AI — shared tool chrome for *.openthermalai.com apps.
 * Injects bilingual disclaimer + a mobile-friendly close control.
 */
(function () {
  'use strict';

  if (typeof document === 'undefined') return;
  if (window.__OTA_TOOL_CHROME__) return;
  window.__OTA_TOOL_CHROME__ = true;

  var HUB_DEFAULT = 'https://www.openthermalai.com/tools.html';
  var SITE = 'https://www.openthermalai.com';

  var SUMMARY_ZH =
    'Open Thermal AI（由荆炎荣创办）仅供工程学习与一般参考，不构成法律、监管或任何专业意见；站内工具与 AI 工程助手为工程辅助、按「现状」提供不作担保，正式设计与采购须由持证专家复核，并以官方文本为准。不代表雇主或第三方立场。';
  var SUMMARY_EN =
    'Open Thermal AI (founded by Jing Yanrong) is for engineering learning and general reference only—not legal, regulatory, or other professional advice. On-site tools and Copilot are engineering aids provided as-is without warranty; qualified engineers must review before design or procurement, and official sources prevail for important decisions. Not the views of employers or third parties.';

  var DETAIL_ZH_1 =
    '本工具为 Open Thermal AI 工业热泵智能平台公开工程计算器之一。内容仅供一般性信息参考、个人学习与行业交流，不构成任何司法辖区下的法律意见、监管解释、税务或证券建议、工程设计签认、产品合格/认证结论或投资建议；亦不代表创办人现任或过往雇主、客户及任何政府机构、行业协会或第三方的立场。';
  var DETAIL_ZH_2 =
    '计算结果由确定性工程算法给出，可能配合 AI 辅助解释；不可作为采购依据或注册工程师盖章交付物。尽管已尽合理努力，不对准确性、完整性、时效性及对特定场景的适用性作任何明示或默示担保。您因信赖本工具输出作出的决策或行动，风险与责任由您自行承担。';
  var DETAIL_ZH_3 =
    '访问本工具不形成律师—客户关系或其他受监管的专业服务关系；不保证持续可用或安全；未经许可不得以商业目的复制或再传播实质性内容。如需更正或反馈，请通过 Open Thermal AI 主站联系方式提出。';

  var DETAIL_EN_1 =
    'This calculator is part of Open Thermal AI—an industrial heat-pump intelligence platform. Content is for general information, personal learning and industry exchange only. It does not constitute legal advice, regulatory interpretation, tax or securities advice, engineering sign-off, product conformity or certification, or investment advice in any jurisdiction, nor the views of the founder’s employers, clients, government bodies, trade associations or any third party.';
  var DETAIL_EN_2 =
    'Results come from deterministic engineering algorithms and may be accompanied by AI-assisted explanation—not a basis for procurement or PE-stamped deliverables. Despite reasonable care, no express or implied warranty is given as to accuracy, completeness, currency or fitness for your situation. You bear sole risk for decisions or actions taken in reliance on this tool.';
  var DETAIL_EN_3 =
    'No attorney–client or other regulated professional relationship is created. Availability or security is not guaranteed. Substantial commercial republication is not permitted without permission. For corrections, contact the editor via the Open Thermal AI main site.';

  function scriptEl() {
    return document.currentScript || document.querySelector('script[src*="ota-tool-chrome"]');
  }

  function hubUrl() {
    var s = scriptEl();
    var fromData = s && s.getAttribute('data-ota-hub');
    return (fromData && String(fromData).trim()) || HUB_DEFAULT;
  }

  function preferZh() {
    var lang = (document.documentElement.lang || navigator.language || 'en').toLowerCase();
    return lang.indexOf('zh') === 0;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (attrs[k] == null || attrs[k] === false) return;
        if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k] === true ? '' : String(attrs[k]));
      });
    }
    (children || []).forEach(function (c) {
      if (c) node.appendChild(c);
    });
    return node;
  }

  function closeApp() {
    var hub = hubUrl();
    try {
      window.close();
    } catch (_) {
      /* ignore */
    }
    window.setTimeout(function () {
      try {
        if (window.history.length > 1) {
          window.history.back();
          window.setTimeout(function () {
            if (!document.hidden) window.location.href = hub;
          }, 350);
          return;
        }
      } catch (_) {
        /* ignore */
      }
      window.location.href = hub;
    }, 120);
  }

  function ensureCloseButton() {
    var existing =
      document.getElementById('closeButton') ||
      document.getElementById('close-app-btn') ||
      document.querySelector('[data-ota-close]');

    var btn = existing;
    if (!btn) {
      btn = el('button', {
        type: 'button',
        id: 'ota-tool-close',
        class: 'ota-tool-close',
        'data-ota-close': '1',
        'aria-label': preferZh() ? '关闭' : 'Close',
        title: preferZh() ? '关闭' : 'Close',
      });
      btn.innerHTML =
        '<svg class="ota-tool-close__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
      document.body.appendChild(btn);
    } else {
      btn.classList.add('ota-tool-close');
      btn.setAttribute('type', 'button');
      btn.setAttribute('data-ota-close', '1');
      if (!btn.getAttribute('aria-label')) {
        btn.setAttribute('aria-label', preferZh() ? '关闭' : 'Close');
      }
    }

    if (btn.dataset.otaCloseBound === '1') return btn;
    btn.dataset.otaCloseBound = '1';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeApp();
    });
    return btn;
  }

  function buildDisclaimer() {
    var aside = el('aside', {
      class: 'ota-tool-disclaimer',
      role: 'note',
      'aria-label': '法律与人工智能说明 / Legal and AI notice',
      'data-ota-disclaimer-root': '1',
    });

    aside.appendChild(
      el('p', {
        class: 'ota-tool-disclaimer__brand',
        text: 'Open Thermal AI',
      })
    );

    var summary = el('div', { class: 'ota-tool-disclaimer__summary' });
    summary.appendChild(el('p', { class: 'ota-tool-disclaimer__zh', lang: 'zh-CN', text: SUMMARY_ZH }));
    summary.appendChild(el('p', { class: 'ota-tool-disclaimer__en', lang: 'en', text: SUMMARY_EN }));
    aside.appendChild(summary);

    var links = el('p', { class: 'ota-tool-disclaimer__links' });
    links.innerHTML =
      '<a href="' +
      SITE +
      '/why.html" target="_blank" rel="noopener noreferrer">法律说明 / Legal</a> · ' +
      '<a href="' +
      SITE +
      '/privacy-data.html" target="_blank" rel="noopener noreferrer">隐私 / Privacy</a> · ' +
      '<a href="' +
      SITE +
      '/terms.html" target="_blank" rel="noopener noreferrer">条款 / Terms</a> · ' +
      '<a href="' +
      SITE +
      '/tools.html" target="_blank" rel="noopener noreferrer">工具箱 / Tools</a>';
    aside.appendChild(links);

    var details = el('details', { class: 'ota-tool-disclaimer__details' });
    details.appendChild(
      el('summary', {
        class: 'ota-tool-disclaimer__summary-trigger',
        text: '详细说明（中英） / Full notice (EN & ZH)',
      })
    );
    var expanded = el('div', { class: 'ota-tool-disclaimer__expanded' });
    [
      [DETAIL_ZH_1, 'zh-CN', 'ota-tool-disclaimer__zh'],
      [DETAIL_EN_1, 'en', 'ota-tool-disclaimer__en'],
      [DETAIL_ZH_2, 'zh-CN', 'ota-tool-disclaimer__zh'],
      [DETAIL_EN_2, 'en', 'ota-tool-disclaimer__en'],
      [DETAIL_ZH_3, 'zh-CN', 'ota-tool-disclaimer__zh'],
      [DETAIL_EN_3, 'en', 'ota-tool-disclaimer__en'],
    ].forEach(function (row) {
      expanded.appendChild(el('p', { class: row[2], lang: row[1], text: row[0] }));
    });
    details.appendChild(expanded);
    aside.appendChild(details);
    return aside;
  }

  function hideLegacyDisclaimers() {
    var selectors = [
      '[data-ota-legacy-disclaimer]',
      '#app-disclaimer',
      '[data-i18n="app.disclaimer"]',
      '[data-i18n="footer.disclaimerText"]',
      '.footer-disclaimer',
      '#footer-disclaimer',
    ];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (node) {
        if (node.closest('[data-ota-disclaimer-root]')) return;
        node.classList.add('ota-tool-legacy-hidden');
        node.setAttribute('aria-hidden', 'true');
      });
    });
  }

  function mountDisclaimer() {
    if (document.querySelector('[data-ota-disclaimer-root]')) return;

    var slot = document.querySelector('[data-ota-disclaimer]');
    var node = buildDisclaimer();
    if (slot) {
      slot.appendChild(node);
    } else {
      document.body.appendChild(node);
    }
    hideLegacyDisclaimers();
  }

  function boot() {
    ensureCloseButton();
    mountDisclaimer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // SPA / late mounts
  window.setTimeout(boot, 800);
  window.setTimeout(boot, 2000);
})();
