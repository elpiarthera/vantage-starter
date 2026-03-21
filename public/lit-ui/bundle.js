var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i8 = decorators.length - 1, decorator; i8 >= 0; i8--)
    if (decorator = decorators[i8])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};

// node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/css-tag.js
var t = globalThis;
var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s = Symbol();
var o = /* @__PURE__ */ new WeakMap();
var n = class {
  constructor(t6, e7, o8) {
    if (this._$cssResult$ = true, o8 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t6, this.t = e7;
  }
  get styleSheet() {
    let t6 = this.o;
    const s5 = this.t;
    if (e && void 0 === t6) {
      const e7 = void 0 !== s5 && 1 === s5.length;
      e7 && (t6 = o.get(s5)), void 0 === t6 && ((this.o = t6 = new CSSStyleSheet()).replaceSync(this.cssText), e7 && o.set(s5, t6));
    }
    return t6;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t6) => new n("string" == typeof t6 ? t6 : t6 + "", void 0, s);
var i = (t6, ...e7) => {
  const o8 = 1 === t6.length ? t6[0] : e7.reduce((e8, s5, o9) => e8 + ((t7) => {
    if (true === t7._$cssResult$) return t7.cssText;
    if ("number" == typeof t7) return t7;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t7 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s5) + t6[o9 + 1], t6[0]);
  return new n(o8, t6, s);
};
var S = (s5, o8) => {
  if (e) s5.adoptedStyleSheets = o8.map((t6) => t6 instanceof CSSStyleSheet ? t6 : t6.styleSheet);
  else for (const e7 of o8) {
    const o9 = document.createElement("style"), n6 = t.litNonce;
    void 0 !== n6 && o9.setAttribute("nonce", n6), o9.textContent = e7.cssText, s5.appendChild(o9);
  }
};
var c = e ? (t6) => t6 : (t6) => t6 instanceof CSSStyleSheet ? ((t7) => {
  let e7 = "";
  for (const s5 of t7.cssRules) e7 += s5.cssText;
  return r(e7);
})(t6) : t6;

// node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/reactive-element.js
var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
var a = globalThis;
var c2 = a.trustedTypes;
var l = c2 ? c2.emptyScript : "";
var p = a.reactiveElementPolyfillSupport;
var d = (t6, s5) => t6;
var u = { toAttribute(t6, s5) {
  switch (s5) {
    case Boolean:
      t6 = t6 ? l : null;
      break;
    case Object:
    case Array:
      t6 = null == t6 ? t6 : JSON.stringify(t6);
  }
  return t6;
}, fromAttribute(t6, s5) {
  let i8 = t6;
  switch (s5) {
    case Boolean:
      i8 = null !== t6;
      break;
    case Number:
      i8 = null === t6 ? null : Number(t6);
      break;
    case Object:
    case Array:
      try {
        i8 = JSON.parse(t6);
      } catch (t7) {
        i8 = null;
      }
  }
  return i8;
} };
var f = (t6, s5) => !i2(t6, s5);
var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
Symbol.metadata ??= Symbol("metadata"), a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y = class extends HTMLElement {
  static addInitializer(t6) {
    this._$Ei(), (this.l ??= []).push(t6);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t6, s5 = b) {
    if (s5.state && (s5.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t6) && ((s5 = Object.create(s5)).wrapped = true), this.elementProperties.set(t6, s5), !s5.noAccessor) {
      const i8 = Symbol(), h4 = this.getPropertyDescriptor(t6, i8, s5);
      void 0 !== h4 && e2(this.prototype, t6, h4);
    }
  }
  static getPropertyDescriptor(t6, s5, i8) {
    const { get: e7, set: r6 } = h(this.prototype, t6) ?? { get() {
      return this[s5];
    }, set(t7) {
      this[s5] = t7;
    } };
    return { get: e7, set(s6) {
      const h4 = e7?.call(this);
      r6?.call(this, s6), this.requestUpdate(t6, h4, i8);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t6) {
    return this.elementProperties.get(t6) ?? b;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d("elementProperties"))) return;
    const t6 = n2(this);
    t6.finalize(), void 0 !== t6.l && (this.l = [...t6.l]), this.elementProperties = new Map(t6.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
      const t7 = this.properties, s5 = [...r2(t7), ...o2(t7)];
      for (const i8 of s5) this.createProperty(i8, t7[i8]);
    }
    const t6 = this[Symbol.metadata];
    if (null !== t6) {
      const s5 = litPropertyMetadata.get(t6);
      if (void 0 !== s5) for (const [t7, i8] of s5) this.elementProperties.set(t7, i8);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t7, s5] of this.elementProperties) {
      const i8 = this._$Eu(t7, s5);
      void 0 !== i8 && this._$Eh.set(i8, t7);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s5) {
    const i8 = [];
    if (Array.isArray(s5)) {
      const e7 = new Set(s5.flat(1 / 0).reverse());
      for (const s6 of e7) i8.unshift(c(s6));
    } else void 0 !== s5 && i8.push(c(s5));
    return i8;
  }
  static _$Eu(t6, s5) {
    const i8 = s5.attribute;
    return false === i8 ? void 0 : "string" == typeof i8 ? i8 : "string" == typeof t6 ? t6.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t6) => this.enableUpdating = t6), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t6) => t6(this));
  }
  addController(t6) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t6), void 0 !== this.renderRoot && this.isConnected && t6.hostConnected?.();
  }
  removeController(t6) {
    this._$EO?.delete(t6);
  }
  _$E_() {
    const t6 = /* @__PURE__ */ new Map(), s5 = this.constructor.elementProperties;
    for (const i8 of s5.keys()) this.hasOwnProperty(i8) && (t6.set(i8, this[i8]), delete this[i8]);
    t6.size > 0 && (this._$Ep = t6);
  }
  createRenderRoot() {
    const t6 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S(t6, this.constructor.elementStyles), t6;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t6) => t6.hostConnected?.());
  }
  enableUpdating(t6) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t6) => t6.hostDisconnected?.());
  }
  attributeChangedCallback(t6, s5, i8) {
    this._$AK(t6, i8);
  }
  _$ET(t6, s5) {
    const i8 = this.constructor.elementProperties.get(t6), e7 = this.constructor._$Eu(t6, i8);
    if (void 0 !== e7 && true === i8.reflect) {
      const h4 = (void 0 !== i8.converter?.toAttribute ? i8.converter : u).toAttribute(s5, i8.type);
      this._$Em = t6, null == h4 ? this.removeAttribute(e7) : this.setAttribute(e7, h4), this._$Em = null;
    }
  }
  _$AK(t6, s5) {
    const i8 = this.constructor, e7 = i8._$Eh.get(t6);
    if (void 0 !== e7 && this._$Em !== e7) {
      const t7 = i8.getPropertyOptions(e7), h4 = "function" == typeof t7.converter ? { fromAttribute: t7.converter } : void 0 !== t7.converter?.fromAttribute ? t7.converter : u;
      this._$Em = e7;
      const r6 = h4.fromAttribute(s5, t7.type);
      this[e7] = r6 ?? this._$Ej?.get(e7) ?? r6, this._$Em = null;
    }
  }
  requestUpdate(t6, s5, i8, e7 = false, h4) {
    if (void 0 !== t6) {
      const r6 = this.constructor;
      if (false === e7 && (h4 = this[t6]), i8 ??= r6.getPropertyOptions(t6), !((i8.hasChanged ?? f)(h4, s5) || i8.useDefault && i8.reflect && h4 === this._$Ej?.get(t6) && !this.hasAttribute(r6._$Eu(t6, i8)))) return;
      this.C(t6, s5, i8);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t6, s5, { useDefault: i8, reflect: e7, wrapped: h4 }, r6) {
    i8 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t6) && (this._$Ej.set(t6, r6 ?? s5 ?? this[t6]), true !== h4 || void 0 !== r6) || (this._$AL.has(t6) || (this.hasUpdated || i8 || (s5 = void 0), this._$AL.set(t6, s5)), true === e7 && this._$Em !== t6 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t6));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t7) {
      Promise.reject(t7);
    }
    const t6 = this.scheduleUpdate();
    return null != t6 && await t6, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [t8, s6] of this._$Ep) this[t8] = s6;
        this._$Ep = void 0;
      }
      const t7 = this.constructor.elementProperties;
      if (t7.size > 0) for (const [s6, i8] of t7) {
        const { wrapped: t8 } = i8, e7 = this[s6];
        true !== t8 || this._$AL.has(s6) || void 0 === e7 || this.C(s6, void 0, i8, e7);
      }
    }
    let t6 = false;
    const s5 = this._$AL;
    try {
      t6 = this.shouldUpdate(s5), t6 ? (this.willUpdate(s5), this._$EO?.forEach((t7) => t7.hostUpdate?.()), this.update(s5)) : this._$EM();
    } catch (s6) {
      throw t6 = false, this._$EM(), s6;
    }
    t6 && this._$AE(s5);
  }
  willUpdate(t6) {
  }
  _$AE(t6) {
    this._$EO?.forEach((t7) => t7.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t6)), this.updated(t6);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t6) {
    return true;
  }
  update(t6) {
    this._$Eq &&= this._$Eq.forEach((t7) => this._$ET(t7, this[t7])), this._$EM();
  }
  updated(t6) {
  }
  firstUpdated(t6) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ??= []).push("2.1.2");

// node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/lit-html.js
var t2 = globalThis;
var i3 = (t6) => t6;
var s2 = t2.trustedTypes;
var e3 = s2 ? s2.createPolicy("lit-html", { createHTML: (t6) => t6 }) : void 0;
var h2 = "$lit$";
var o3 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n3 = "?" + o3;
var r3 = `<${n3}>`;
var l2 = document;
var c3 = () => l2.createComment("");
var a2 = (t6) => null === t6 || "object" != typeof t6 && "function" != typeof t6;
var u2 = Array.isArray;
var d2 = (t6) => u2(t6) || "function" == typeof t6?.[Symbol.iterator];
var f2 = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p2 = RegExp(`>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y2 = /^(?:script|style|textarea|title)$/i;
var x = (t6) => (i8, ...s5) => ({ _$litType$: t6, strings: i8, values: s5 });
var b2 = x(1);
var w = x(2);
var T = x(3);
var E = Symbol.for("lit-noChange");
var A = Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l2.createTreeWalker(l2, 129);
function V(t6, i8) {
  if (!u2(t6) || !t6.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e3 ? e3.createHTML(i8) : i8;
}
var N = (t6, i8) => {
  const s5 = t6.length - 1, e7 = [];
  let n6, l3 = 2 === i8 ? "<svg>" : 3 === i8 ? "<math>" : "", c5 = v;
  for (let i9 = 0; i9 < s5; i9++) {
    const s6 = t6[i9];
    let a3, u5, d3 = -1, f3 = 0;
    for (; f3 < s6.length && (c5.lastIndex = f3, u5 = c5.exec(s6), null !== u5); ) f3 = c5.lastIndex, c5 === v ? "!--" === u5[1] ? c5 = _ : void 0 !== u5[1] ? c5 = m : void 0 !== u5[2] ? (y2.test(u5[2]) && (n6 = RegExp("</" + u5[2], "g")), c5 = p2) : void 0 !== u5[3] && (c5 = p2) : c5 === p2 ? ">" === u5[0] ? (c5 = n6 ?? v, d3 = -1) : void 0 === u5[1] ? d3 = -2 : (d3 = c5.lastIndex - u5[2].length, a3 = u5[1], c5 = void 0 === u5[3] ? p2 : '"' === u5[3] ? $ : g) : c5 === $ || c5 === g ? c5 = p2 : c5 === _ || c5 === m ? c5 = v : (c5 = p2, n6 = void 0);
    const x2 = c5 === p2 && t6[i9 + 1].startsWith("/>") ? " " : "";
    l3 += c5 === v ? s6 + r3 : d3 >= 0 ? (e7.push(a3), s6.slice(0, d3) + h2 + s6.slice(d3) + o3 + x2) : s6 + o3 + (-2 === d3 ? i9 : x2);
  }
  return [V(t6, l3 + (t6[s5] || "<?>") + (2 === i8 ? "</svg>" : 3 === i8 ? "</math>" : "")), e7];
};
var S2 = class _S {
  constructor({ strings: t6, _$litType$: i8 }, e7) {
    let r6;
    this.parts = [];
    let l3 = 0, a3 = 0;
    const u5 = t6.length - 1, d3 = this.parts, [f3, v3] = N(t6, i8);
    if (this.el = _S.createElement(f3, e7), P.currentNode = this.el.content, 2 === i8 || 3 === i8) {
      const t7 = this.el.content.firstChild;
      t7.replaceWith(...t7.childNodes);
    }
    for (; null !== (r6 = P.nextNode()) && d3.length < u5; ) {
      if (1 === r6.nodeType) {
        if (r6.hasAttributes()) for (const t7 of r6.getAttributeNames()) if (t7.endsWith(h2)) {
          const i9 = v3[a3++], s5 = r6.getAttribute(t7).split(o3), e8 = /([.?@])?(.*)/.exec(i9);
          d3.push({ type: 1, index: l3, name: e8[2], strings: s5, ctor: "." === e8[1] ? I : "?" === e8[1] ? L : "@" === e8[1] ? z : H }), r6.removeAttribute(t7);
        } else t7.startsWith(o3) && (d3.push({ type: 6, index: l3 }), r6.removeAttribute(t7));
        if (y2.test(r6.tagName)) {
          const t7 = r6.textContent.split(o3), i9 = t7.length - 1;
          if (i9 > 0) {
            r6.textContent = s2 ? s2.emptyScript : "";
            for (let s5 = 0; s5 < i9; s5++) r6.append(t7[s5], c3()), P.nextNode(), d3.push({ type: 2, index: ++l3 });
            r6.append(t7[i9], c3());
          }
        }
      } else if (8 === r6.nodeType) if (r6.data === n3) d3.push({ type: 2, index: l3 });
      else {
        let t7 = -1;
        for (; -1 !== (t7 = r6.data.indexOf(o3, t7 + 1)); ) d3.push({ type: 7, index: l3 }), t7 += o3.length - 1;
      }
      l3++;
    }
  }
  static createElement(t6, i8) {
    const s5 = l2.createElement("template");
    return s5.innerHTML = t6, s5;
  }
};
function M(t6, i8, s5 = t6, e7) {
  if (i8 === E) return i8;
  let h4 = void 0 !== e7 ? s5._$Co?.[e7] : s5._$Cl;
  const o8 = a2(i8) ? void 0 : i8._$litDirective$;
  return h4?.constructor !== o8 && (h4?._$AO?.(false), void 0 === o8 ? h4 = void 0 : (h4 = new o8(t6), h4._$AT(t6, s5, e7)), void 0 !== e7 ? (s5._$Co ??= [])[e7] = h4 : s5._$Cl = h4), void 0 !== h4 && (i8 = M(t6, h4._$AS(t6, i8.values), h4, e7)), i8;
}
var R = class {
  constructor(t6, i8) {
    this._$AV = [], this._$AN = void 0, this._$AD = t6, this._$AM = i8;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t6) {
    const { el: { content: i8 }, parts: s5 } = this._$AD, e7 = (t6?.creationScope ?? l2).importNode(i8, true);
    P.currentNode = e7;
    let h4 = P.nextNode(), o8 = 0, n6 = 0, r6 = s5[0];
    for (; void 0 !== r6; ) {
      if (o8 === r6.index) {
        let i9;
        2 === r6.type ? i9 = new k(h4, h4.nextSibling, this, t6) : 1 === r6.type ? i9 = new r6.ctor(h4, r6.name, r6.strings, this, t6) : 6 === r6.type && (i9 = new Z(h4, this, t6)), this._$AV.push(i9), r6 = s5[++n6];
      }
      o8 !== r6?.index && (h4 = P.nextNode(), o8++);
    }
    return P.currentNode = l2, e7;
  }
  p(t6) {
    let i8 = 0;
    for (const s5 of this._$AV) void 0 !== s5 && (void 0 !== s5.strings ? (s5._$AI(t6, s5, i8), i8 += s5.strings.length - 2) : s5._$AI(t6[i8])), i8++;
  }
};
var k = class _k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t6, i8, s5, e7) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t6, this._$AB = i8, this._$AM = s5, this.options = e7, this._$Cv = e7?.isConnected ?? true;
  }
  get parentNode() {
    let t6 = this._$AA.parentNode;
    const i8 = this._$AM;
    return void 0 !== i8 && 11 === t6?.nodeType && (t6 = i8.parentNode), t6;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t6, i8 = this) {
    t6 = M(this, t6, i8), a2(t6) ? t6 === A || null == t6 || "" === t6 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t6 !== this._$AH && t6 !== E && this._(t6) : void 0 !== t6._$litType$ ? this.$(t6) : void 0 !== t6.nodeType ? this.T(t6) : d2(t6) ? this.k(t6) : this._(t6);
  }
  O(t6) {
    return this._$AA.parentNode.insertBefore(t6, this._$AB);
  }
  T(t6) {
    this._$AH !== t6 && (this._$AR(), this._$AH = this.O(t6));
  }
  _(t6) {
    this._$AH !== A && a2(this._$AH) ? this._$AA.nextSibling.data = t6 : this.T(l2.createTextNode(t6)), this._$AH = t6;
  }
  $(t6) {
    const { values: i8, _$litType$: s5 } = t6, e7 = "number" == typeof s5 ? this._$AC(t6) : (void 0 === s5.el && (s5.el = S2.createElement(V(s5.h, s5.h[0]), this.options)), s5);
    if (this._$AH?._$AD === e7) this._$AH.p(i8);
    else {
      const t7 = new R(e7, this), s6 = t7.u(this.options);
      t7.p(i8), this.T(s6), this._$AH = t7;
    }
  }
  _$AC(t6) {
    let i8 = C.get(t6.strings);
    return void 0 === i8 && C.set(t6.strings, i8 = new S2(t6)), i8;
  }
  k(t6) {
    u2(this._$AH) || (this._$AH = [], this._$AR());
    const i8 = this._$AH;
    let s5, e7 = 0;
    for (const h4 of t6) e7 === i8.length ? i8.push(s5 = new _k(this.O(c3()), this.O(c3()), this, this.options)) : s5 = i8[e7], s5._$AI(h4), e7++;
    e7 < i8.length && (this._$AR(s5 && s5._$AB.nextSibling, e7), i8.length = e7);
  }
  _$AR(t6 = this._$AA.nextSibling, s5) {
    for (this._$AP?.(false, true, s5); t6 !== this._$AB; ) {
      const s6 = i3(t6).nextSibling;
      i3(t6).remove(), t6 = s6;
    }
  }
  setConnected(t6) {
    void 0 === this._$AM && (this._$Cv = t6, this._$AP?.(t6));
  }
};
var H = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t6, i8, s5, e7, h4) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t6, this.name = i8, this._$AM = e7, this.options = h4, s5.length > 2 || "" !== s5[0] || "" !== s5[1] ? (this._$AH = Array(s5.length - 1).fill(new String()), this.strings = s5) : this._$AH = A;
  }
  _$AI(t6, i8 = this, s5, e7) {
    const h4 = this.strings;
    let o8 = false;
    if (void 0 === h4) t6 = M(this, t6, i8, 0), o8 = !a2(t6) || t6 !== this._$AH && t6 !== E, o8 && (this._$AH = t6);
    else {
      const e8 = t6;
      let n6, r6;
      for (t6 = h4[0], n6 = 0; n6 < h4.length - 1; n6++) r6 = M(this, e8[s5 + n6], i8, n6), r6 === E && (r6 = this._$AH[n6]), o8 ||= !a2(r6) || r6 !== this._$AH[n6], r6 === A ? t6 = A : t6 !== A && (t6 += (r6 ?? "") + h4[n6 + 1]), this._$AH[n6] = r6;
    }
    o8 && !e7 && this.j(t6);
  }
  j(t6) {
    t6 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t6 ?? "");
  }
};
var I = class extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t6) {
    this.element[this.name] = t6 === A ? void 0 : t6;
  }
};
var L = class extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t6) {
    this.element.toggleAttribute(this.name, !!t6 && t6 !== A);
  }
};
var z = class extends H {
  constructor(t6, i8, s5, e7, h4) {
    super(t6, i8, s5, e7, h4), this.type = 5;
  }
  _$AI(t6, i8 = this) {
    if ((t6 = M(this, t6, i8, 0) ?? A) === E) return;
    const s5 = this._$AH, e7 = t6 === A && s5 !== A || t6.capture !== s5.capture || t6.once !== s5.once || t6.passive !== s5.passive, h4 = t6 !== A && (s5 === A || e7);
    e7 && this.element.removeEventListener(this.name, this, s5), h4 && this.element.addEventListener(this.name, this, t6), this._$AH = t6;
  }
  handleEvent(t6) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t6) : this._$AH.handleEvent(t6);
  }
};
var Z = class {
  constructor(t6, i8, s5) {
    this.element = t6, this.type = 6, this._$AN = void 0, this._$AM = i8, this.options = s5;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t6) {
    M(this, t6);
  }
};
var j = { M: h2, P: o3, A: n3, C: 1, L: N, R, D: d2, V: M, I: k, H, N: L, U: z, B: I, F: Z };
var B = t2.litHtmlPolyfillSupport;
B?.(S2, k), (t2.litHtmlVersions ??= []).push("3.3.2");
var D = (t6, i8, s5) => {
  const e7 = s5?.renderBefore ?? i8;
  let h4 = e7._$litPart$;
  if (void 0 === h4) {
    const t7 = s5?.renderBefore ?? null;
    e7._$litPart$ = h4 = new k(i8.insertBefore(c3(), t7), t7, void 0, s5 ?? {});
  }
  return h4._$AI(t6), h4;
};

// node_modules/.pnpm/lit-element@4.2.2/node_modules/lit-element/lit-element.js
var s3 = globalThis;
var i4 = class extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t6 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t6.firstChild, t6;
  }
  update(t6) {
    const r6 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t6), this._$Do = D(r6, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return E;
  }
};
i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
var o4 = s3.litElementPolyfillSupport;
o4?.({ LitElement: i4 });
(s3.litElementVersions ??= []).push("4.2.2");

// node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/is-server.js
var o5 = false;

// node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/decorators/custom-element.js
var t3 = (t6) => (e7, o8) => {
  void 0 !== o8 ? o8.addInitializer(() => {
    customElements.define(t6, e7);
  }) : customElements.define(t6, e7);
};

// node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/decorators/property.js
var o6 = { attribute: true, type: String, converter: u, reflect: false, hasChanged: f };
var r4 = (t6 = o6, e7, r6) => {
  const { kind: n6, metadata: i8 } = r6;
  let s5 = globalThis.litPropertyMetadata.get(i8);
  if (void 0 === s5 && globalThis.litPropertyMetadata.set(i8, s5 = /* @__PURE__ */ new Map()), "setter" === n6 && ((t6 = Object.create(t6)).wrapped = true), s5.set(r6.name, t6), "accessor" === n6) {
    const { name: o8 } = r6;
    return { set(r7) {
      const n7 = e7.get.call(this);
      e7.set.call(this, r7), this.requestUpdate(o8, n7, t6, true, r7);
    }, init(e8) {
      return void 0 !== e8 && this.C(o8, void 0, t6, e8), e8;
    } };
  }
  if ("setter" === n6) {
    const { name: o8 } = r6;
    return function(r7) {
      const n7 = this[o8];
      e7.call(this, r7), this.requestUpdate(o8, n7, t6, true, r7);
    };
  }
  throw Error("Unsupported decorator location: " + n6);
};
function n4(t6) {
  return (e7, o8) => "object" == typeof o8 ? r4(t6, e7, o8) : ((t7, e8, o9) => {
    const r6 = e8.hasOwnProperty(o9);
    return e8.constructor.createProperty(o9, t7), r6 ? Object.getOwnPropertyDescriptor(e8, o9) : void 0;
  })(t6, e7, o8);
}

// node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/decorators/state.js
function r5(r6) {
  return n4({ ...r6, state: true, attribute: false });
}

// node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/decorators/base.js
var e4 = (e7, t6, c5) => (c5.configurable = true, c5.enumerable = true, Reflect.decorate && "object" != typeof t6 && Object.defineProperty(e7, t6, c5), c5);

// node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/decorators/query.js
function e5(e7, r6) {
  return (n6, s5, i8) => {
    const o8 = (t6) => t6.renderRoot?.querySelector(e7) ?? null;
    if (r6) {
      const { get: e8, set: r7 } = "object" == typeof s5 ? n6 : i8 ?? (() => {
        const t6 = Symbol();
        return { get() {
          return this[t6];
        }, set(e9) {
          this[t6] = e9;
        } };
      })();
      return e4(n6, s5, { get() {
        let t6 = e8.call(this);
        return void 0 === t6 && (t6 = o8(this), (null !== t6 || this.hasUpdated) && r7.call(this, t6)), t6;
      } });
    }
    return e4(n6, s5, { get() {
      return o8(this);
    } });
  };
}

// inline-css:/home/laurentperello/coding/vantage-starter/src/lib/lit-ui/host-defaults.css
var host_defaults_default = "/**\n * Shadow DOM Host Defaults for Tailwind v4 @property Workaround\n *\n * Tailwind v4 uses CSS @property declarations that only work at document level.\n * This file provides default values for all @property-dependent variables.\n */\n\n:host {\n  /* Shadow/Ring defaults */\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-color: initial;\n  --tw-inset-shadow: 0 0 #0000;\n  --tw-inset-shadow-color: initial;\n  --tw-ring-color: initial;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-ring-inset: ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-offset-shadow: 0 0 #0000;\n\n  /* Transform defaults */\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-translate-z: 0;\n  --tw-rotate-x: 0;\n  --tw-rotate-y: 0;\n  --tw-rotate-z: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-scale-z: 1;\n\n  /* Border defaults */\n  --tw-border-style: solid;\n\n  /* Typography defaults */\n  --tw-font-weight: initial;\n  --tw-tracking: initial;\n  --tw-leading: initial;\n\n  /* Backdrop filter defaults */\n  --tw-backdrop-blur: initial;\n  --tw-backdrop-brightness: initial;\n  --tw-backdrop-contrast: initial;\n  --tw-backdrop-grayscale: initial;\n  --tw-backdrop-hue-rotate: initial;\n  --tw-backdrop-invert: initial;\n  --tw-backdrop-opacity: initial;\n  --tw-backdrop-saturate: initial;\n  --tw-backdrop-sepia: initial;\n\n  /* Filter defaults */\n  --tw-blur: initial;\n  --tw-brightness: initial;\n  --tw-contrast: initial;\n  --tw-grayscale: initial;\n  --tw-hue-rotate: initial;\n  --tw-invert: initial;\n  --tw-saturate: initial;\n  --tw-sepia: initial;\n  --tw-drop-shadow: initial;\n\n  /* Gradient defaults */\n  --tw-gradient-from: transparent;\n  --tw-gradient-to: transparent;\n  --tw-gradient-via: transparent;\n  --tw-gradient-stops: initial;\n  --tw-gradient-from-position: 0%;\n  --tw-gradient-via-position: 50%;\n  --tw-gradient-to-position: 100%;\n\n  /* Divide defaults */\n  --tw-divide-x-reverse: 0;\n  --tw-divide-y-reverse: 0;\n\n  /* Space defaults */\n  --tw-space-x-reverse: 0;\n  --tw-space-y-reverse: 0;\n\n  /* Outline defaults */\n  --tw-outline-style: solid;\n}\n";

// inline-css:/home/laurentperello/coding/vantage-starter/src/lib/lit-ui/tailwind.css
var tailwind_default = '/**\n * Tailwind CSS v4 Configuration for lit-ui Components\n *\n * This file defines design tokens and theme customizations.\n * Add your own customizations below the @import.\n */\n@import "tailwindcss";\n\n@theme {\n  /* ==========================================================================\n   * SEMANTIC COLOR TOKENS\n   * These are used by lit-ui components. Customize to match your brand.\n   * ========================================================================== */\n\n  /* Primary - Main brand color for buttons, links, focus states */\n  --color-primary: var(--color-blue-500);\n  --color-primary-foreground: white;\n\n  /* Secondary - Subtle backgrounds and secondary actions */\n  --color-secondary: var(--color-gray-100);\n  --color-secondary-foreground: var(--color-gray-900);\n\n  /* Destructive - Errors, delete actions, warnings */\n  --color-destructive: var(--color-red-500);\n  --color-destructive-foreground: white;\n\n  /* Muted - Disabled states, subtle text */\n  --color-muted: var(--color-gray-100);\n  --color-muted-foreground: var(--color-gray-500);\n\n  /* Accent - Hover states, highlights */\n  --color-accent: var(--color-gray-100);\n  --color-accent-foreground: var(--color-gray-900);\n\n  /* Background and foreground - Page-level colors */\n  --color-background: white;\n  --color-foreground: var(--color-gray-950);\n\n  /* Borders, inputs, focus ring */\n  --color-border: var(--color-gray-200);\n  --color-input: var(--color-gray-100);\n  --color-ring: var(--color-blue-400);\n}\n\n/* ==========================================================================\n * DARK MODE (optional)\n * CSS custom properties cascade into Shadow DOM from ancestor elements.\n * Add .dark class to html or body to enable dark mode.\n * ========================================================================== */\n.dark {\n  --color-primary: var(--color-blue-400);\n  --color-primary-foreground: var(--color-gray-950);\n\n  --color-secondary: var(--color-gray-800);\n  --color-secondary-foreground: var(--color-gray-100);\n\n  --color-destructive: var(--color-red-400);\n  --color-destructive-foreground: var(--color-gray-950);\n\n  --color-muted: var(--color-gray-800);\n  --color-muted-foreground: var(--color-gray-400);\n\n  --color-accent: var(--color-gray-800);\n  --color-accent-foreground: var(--color-gray-100);\n\n  --color-background: var(--color-gray-950);\n  --color-foreground: var(--color-gray-50);\n\n  --color-border: var(--color-gray-800);\n  --color-input: var(--color-gray-800);\n  --color-ring: var(--color-blue-600);\n}\n\n/* Prevent layout shift when scrollbar appears/disappears */\nhtml {\n  scrollbar-gutter: stable;\n}\n\n/* Dialog scroll lock */\nbody:has(dialog[open]) {\n  overflow: hidden;\n}\n';

// src/lib/lit-ui/tailwind-element.ts
var tailwindSheet = new CSSStyleSheet();
tailwindSheet.replaceSync(tailwind_default);
var hostDefaultsSheet = new CSSStyleSheet();
hostDefaultsSheet.replaceSync(host_defaults_default);
var propertyRulePattern = /@property\s+[^{]+\{[^}]+\}/g;
var propertyRules = tailwind_default.match(propertyRulePattern) || [];
if (propertyRules.length > 0 && typeof document !== "undefined") {
  const propertySheet = new CSSStyleSheet();
  propertySheet.replaceSync(propertyRules.join("\n"));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, propertySheet];
}
var TailwindElement = class extends i4 {
  static {
    this.styles = [];
  }
  connectedCallback() {
    super.connectedCallback();
    this._adoptTailwindStyles();
  }
  _adoptTailwindStyles() {
    if (this.shadowRoot) {
      const existingSheets = this.shadowRoot.adoptedStyleSheets;
      this.shadowRoot.adoptedStyleSheets = [
        tailwindSheet,
        hostDefaultsSheet,
        ...existingSheets
      ];
    }
  }
};

// src/components/ui/button.ts
var Button = class extends TailwindElement {
  constructor() {
    super();
    this.variant = "primary";
    this.size = "md";
    this.type = "button";
    this.disabled = false;
    this.loading = false;
    this.internals = this.attachInternals();
  }
  /**
   * Get the Tailwind classes for the current variant.
   */
  getVariantClasses() {
    const variants = {
      primary: "bg-primary text-primary-foreground hover:opacity-90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
      outline: "border border-border bg-transparent text-foreground hover:bg-accent",
      ghost: "bg-transparent text-foreground hover:bg-accent",
      destructive: "bg-destructive text-destructive-foreground hover:opacity-90"
    };
    return variants[this.variant];
  }
  /**
   * Get the Tailwind classes for the current size.
   * Includes gap for icon spacing.
   */
  getSizeClasses() {
    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2 text-base gap-2",
      lg: "px-6 py-3 text-lg gap-2.5"
    };
    return sizes[this.size];
  }
  /**
   * Get the base classes common to all button variants.
   */
  getBaseClasses() {
    return "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150";
  }
  /**
   * Get classes for the disabled/loading state.
   */
  getDisabledClasses() {
    return this.disabled || this.loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  }
  /**
   * Render the pulsing dots spinner.
   * Uses three dots with staggered animation delays.
   */
  renderSpinner() {
    return b2`<span class="spinner" aria-hidden="true"><span></span></span>`;
  }
  /**
   * Handle click events.
   * Prevents action when disabled or loading.
   * Triggers form submission or reset based on button type.
   */
  handleClick(e7) {
    if (this.disabled || this.loading) {
      e7.preventDefault();
      e7.stopPropagation();
      return;
    }
    if (this.type === "submit" && this.internals.form) {
      this.internals.form.requestSubmit();
    } else if (this.type === "reset" && this.internals.form) {
      this.internals.form.reset();
    }
  }
  /**
   * Combine all classes into a single string.
   */
  getButtonClasses() {
    return [
      this.getBaseClasses(),
      this.getVariantClasses(),
      this.getSizeClasses(),
      this.getDisabledClasses()
    ].join(" ");
  }
  render() {
    return b2`
      <button
        class=${this.getButtonClasses()}
        ?aria-disabled=${this.disabled || this.loading}
        ?aria-busy=${this.loading}
        aria-label=${this.loading ? "Loading" : A}
        @click=${this.handleClick}
        type="button"
      >
        <slot name="icon-start"></slot>
        ${this.loading ? this.renderSpinner() : b2`<slot></slot>`}
        <slot name="icon-end"></slot>
      </button>
    `;
  }
};
/**
 * Enable form association for this custom element.
 * This allows the button to participate in form submission/reset.
 */
Button.formAssociated = true;
/**
 * Static styles for focus ring (inner glow) and loading spinner
 * that cannot be expressed with Tailwind utility classes alone.
 */
Button.styles = i`
    :host {
      display: inline-block;
    }

    :host([disabled]),
    :host([loading]) {
      pointer-events: none;
    }

    button:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px var(--color-ring);
    }

    /* Pulsing dots spinner */
    .spinner {
      display: inline-flex;
      align-items: center;
      gap: 0.2em;
    }

    .spinner::before,
    .spinner::after,
    .spinner > span {
      content: '';
      width: 0.4em;
      height: 0.4em;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 1.2s ease-in-out infinite;
    }

    .spinner::before {
      animation-delay: 0s;
    }
    .spinner > span {
      animation-delay: 0.2s;
    }
    .spinner::after {
      animation-delay: 0.4s;
    }

    @keyframes pulse {
      0%,
      80%,
      100% {
        opacity: 0.3;
        transform: scale(0.7);
      }
      40% {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Icon slots - scale with button font-size via em units */
    ::slotted([slot='icon-start']),
    ::slotted([slot='icon-end']) {
      width: 1em;
      height: 1em;
      flex-shrink: 0;
    }
  `;
__decorateClass([
  n4({ type: String })
], Button.prototype, "variant", 2);
__decorateClass([
  n4({ type: String })
], Button.prototype, "size", 2);
__decorateClass([
  n4({ type: String })
], Button.prototype, "type", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Button.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Button.prototype, "loading", 2);
Button = __decorateClass([
  t3("ui-button")
], Button);

// src/lib/lit-ui/core.ts
var tailwindBaseStyles = [];
function dispatchCustomEvent(el, name, detail, options) {
  const event = new CustomEvent(name, {
    detail,
    bubbles: options?.bubbles ?? true,
    composed: options?.composed ?? true,
    cancelable: options?.cancelable ?? false
  });
  return el.dispatchEvent(event);
}

// src/components/ui/input.ts
var Input = class extends TailwindElement {
  constructor() {
    super();
    /**
     * ElementInternals for form participation.
     * Null during SSR since attachInternals() is not available.
     */
    this.internals = null;
    /**
     * Unique ID for the input element, used for label association.
     */
    this.inputId = `lui-input-${Math.random().toString(36).substr(2, 9)}`;
    this.type = "text";
    this.size = "md";
    this.name = "";
    this.value = "";
    this.placeholder = "";
    this.disabled = false;
    this.readonly = false;
    this.required = false;
    this.pattern = "";
    this.label = "";
    this.helperText = "";
    this.requiredIndicator = "asterisk";
    this.clearable = false;
    this.showCount = false;
    this.touched = false;
    this.showError = false;
    this.passwordVisible = false;
    this.hasPrefixContent = false;
    this.hasSuffixContent = false;
    /**
     * Eye icon SVG (password hidden state - click to show).
     */
    this.eyeIcon = w`
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
          stroke="currentColor" stroke-width="2" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="12" r="3"
            stroke="currentColor" stroke-width="2" fill="none"/>
  `;
    /**
     * Eye-off icon SVG (password visible state - click to hide).
     */
    this.eyeOffIcon = w`
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
          stroke="currentColor" stroke-width="2" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="1" y1="1" x2="23" y2="23"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  `;
    /**
     * X-circle icon SVG for clear button.
     */
    this.xCircleIcon = w`
    <circle cx="12" cy="12" r="10"
            stroke="currentColor" stroke-width="2" fill="none"/>
    <line x1="15" y1="9" x2="9" y2="15"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="9" y1="9" x2="15" y2="15"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  `;
    if (!o5) {
      this.internals = this.attachInternals();
    }
  }
  static {
    /**
     * Enable form association for this custom element.
     * This allows the input to participate in form submission.
     */
    this.formAssociated = true;
  }
  static {
    /**
     * Static styles for the input component.
     * Uses CSS custom properties from Phase 26 tokens.
     */
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: inline-block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      /* Input container - flex layout for prefix/suffix slots */
      .input-container {
        display: flex;
        align-items: center;
        border-radius: var(--ui-input-radius);
        border-width: var(--ui-input-border-width);
        border-style: solid;
        border-color: var(--ui-input-border);
        background-color: var(--ui-input-bg);
        transition:
          border-color var(--ui-input-transition),
          box-shadow var(--ui-input-transition);
      }

      .input-container:focus-within {
        border-color: var(--ui-input-border-focus);
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-input-ring));
        outline-offset: 2px;
      }

      .input-container.container-error {
        border-color: var(--ui-input-border-error);
      }

      .input-container.container-disabled {
        background-color: var(--ui-input-bg-disabled);
        border-color: var(--ui-input-border-disabled);
        cursor: not-allowed;
      }

      .input-container.container-readonly {
        background-color: var(--ui-input-bg-readonly, var(--color-muted));
      }

      /* Input element - remove border/bg when inside container */
      input {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        color: var(--ui-input-text);
        outline: none;
      }

      input::placeholder {
        color: var(--ui-input-placeholder);
      }

      /* Disabled state */
      input:disabled {
        color: var(--ui-input-text-disabled);
        cursor: not-allowed;
      }

      /* Readonly state */
      input:read-only:not(:disabled) {
        cursor: text;
      }

      /* Size variants for input */
      input.input-sm {
        padding: var(--ui-input-padding-y-sm) var(--ui-input-padding-x-sm);
        font-size: var(--ui-input-font-size-sm);
      }

      input.input-md {
        padding: var(--ui-input-padding-y-md) var(--ui-input-padding-x-md);
        font-size: var(--ui-input-font-size-md);
      }

      input.input-lg {
        padding: var(--ui-input-padding-y-lg) var(--ui-input-padding-x-lg);
        font-size: var(--ui-input-font-size-lg);
      }

      /* Slot styling - hidden by default, shown when has content */
      .input-slot {
        display: none;
        align-items: center;
      }

      .input-slot.has-content {
        display: flex;
      }

      .prefix-slot.has-content {
        padding-left: var(--ui-input-padding-x-md);
      }

      .suffix-slot.has-content {
        padding-right: var(--ui-input-padding-x-md);
      }

      /* Size-specific slot padding */
      .container-sm .prefix-slot.has-content {
        padding-left: var(--ui-input-padding-x-sm);
      }

      .container-sm .suffix-slot.has-content {
        padding-right: var(--ui-input-padding-x-sm);
      }

      .container-lg .prefix-slot.has-content {
        padding-left: var(--ui-input-padding-x-lg);
      }

      .container-lg .suffix-slot.has-content {
        padding-right: var(--ui-input-padding-x-lg);
      }

      /* Wrapper for label structure */
      .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      /* Label styling - scales with size */
      .input-label {
        font-weight: 500;
        color: var(--ui-input-text);
      }

      .input-label.label-sm {
        font-size: var(--ui-input-font-size-sm);
      }

      .input-label.label-md {
        font-size: var(--ui-input-font-size-md);
      }

      .input-label.label-lg {
        font-size: var(--ui-input-font-size-lg);
      }

      .required-indicator {
        color: var(--ui-input-text-error);
        margin-left: 0.125rem;
      }

      /* Helper text - below label, above input */
      .helper-text {
        font-size: 0.875em;
        color: var(--color-muted-foreground);
      }

      /* Error text - below input */
      .error-text {
        font-size: 0.875em;
        color: var(--ui-input-text-error);
      }

      /* Password toggle button */
      .password-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        margin-right: 0.25rem;
        border: none;
        background: transparent;
        color: var(--color-muted-foreground);
        cursor: pointer;
        border-radius: var(--radius-sm, 0.25rem);
        transition:
          color 150ms,
          background-color 150ms;
      }

      .password-toggle:hover {
        color: var(--ui-input-text);
        background-color: var(--color-muted);
      }

      .password-toggle:focus-visible {
        outline: 2px solid var(--color-ring);
        outline-offset: 1px;
      }

      .toggle-icon {
        width: 1.25em;
        height: 1.25em;
      }

      /* Clear button */
      .clear-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        margin-right: 0.25rem;
        border: none;
        background: transparent;
        color: var(--color-muted-foreground);
        cursor: pointer;
        border-radius: var(--radius-sm, 0.25rem);
        transition:
          color 150ms,
          background-color 150ms;
      }

      .clear-button:hover {
        color: var(--ui-input-text);
        background-color: var(--color-muted);
      }

      .clear-button:focus-visible {
        outline: 2px solid var(--color-ring);
        outline-offset: 1px;
      }

      .clear-icon {
        width: 1.25em;
        height: 1.25em;
      }

      /* Character counter */
      .character-count {
        font-size: 0.75rem;
        color: var(--color-muted-foreground);
        padding-right: var(--ui-input-padding-x-md);
        white-space: nowrap;
      }

      .container-sm .character-count {
        padding-right: var(--ui-input-padding-x-sm);
      }

      .container-lg .character-count {
        padding-right: var(--ui-input-padding-x-lg);
      }

      /* Visually hidden for screen reader only text */
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `
    ];
  }
  /**
   * Sync the input value to the form via ElementInternals.
   */
  updateFormValue() {
    this.internals?.setFormValue(this.value);
  }
  /**
   * Validate the input and sync validity state to ElementInternals.
   * Mirrors native input validity to the custom element for form participation.
   * @returns true if valid, false if invalid
   */
  validate() {
    const input = this.inputEl;
    if (!input || !this.internals) return true;
    const validity = input.validity;
    if (!validity.valid) {
      this.internals.setValidity(
        {
          valueMissing: validity.valueMissing,
          typeMismatch: validity.typeMismatch,
          patternMismatch: validity.patternMismatch,
          tooShort: validity.tooShort,
          tooLong: validity.tooLong,
          rangeUnderflow: validity.rangeUnderflow,
          rangeOverflow: validity.rangeOverflow
        },
        input.validationMessage,
        input
        // anchor for popup positioning
      );
      return false;
    }
    this.internals.setValidity({});
    return true;
  }
  /**
   * Get the current validation error message.
   */
  get errorMessage() {
    return this.internals?.validationMessage || "";
  }
  /**
   * Handle input events from the native input.
   */
  handleInput(e7) {
    const input = e7.target;
    this.value = input.value;
    this.updateFormValue();
    if (this.touched) {
      const isValid2 = this.validate();
      this.showError = !isValid2;
    }
  }
  /**
   * Handle blur events for validation display timing.
   */
  handleBlur() {
    this.touched = true;
    const isValid2 = this.validate();
    this.showError = !isValid2;
  }
  /**
   * Handle container click to focus input.
   * Allows clicking on prefix/suffix areas to focus the input,
   * while not interfering with interactive content (buttons, links).
   */
  handleContainerClick(e7) {
    const target = e7.target;
    if (target === e7.currentTarget || target.closest("slot") && !target.closest("button, a, input")) {
      this.inputEl?.focus();
    }
  }
  /**
   * Handle prefix slot change to track if content exists.
   */
  handlePrefixSlotChange(e7) {
    const slot = e7.target;
    this.hasPrefixContent = slot.assignedNodes().length > 0;
  }
  /**
   * Handle suffix slot change to track if content exists.
   */
  handleSuffixSlotChange(e7) {
    const slot = e7.target;
    this.hasSuffixContent = slot.assignedNodes().length > 0;
  }
  /**
   * Toggle password visibility between hidden and visible.
   */
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
  /**
   * Render the password visibility toggle button.
   */
  renderPasswordToggle() {
    return b2`
      <button
        type="button"
        class="password-toggle"
        aria-pressed=${this.passwordVisible}
        aria-controls=${this.inputId}
        @click=${this.togglePasswordVisibility}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="toggle-icon"
        >
          ${this.passwordVisible ? this.eyeOffIcon : this.eyeIcon}
        </svg>
        <span class="visually-hidden">
          ${this.passwordVisible ? "Hide password" : "Show password"}
        </span>
      </button>
    `;
  }
  /**
   * Render the live region for password toggle announcements.
   */
  renderPasswordLiveRegion() {
    if (this.type !== "password") return A;
    return b2`
      <span class="visually-hidden" role="status" aria-live="polite">
        ${this.passwordVisible ? "Password shown" : "Password hidden"}
      </span>
    `;
  }
  /**
   * Handle clear button click - empties value and returns focus to input.
   */
  handleClear() {
    this.value = "";
    this.updateFormValue();
    this.inputEl?.focus();
    if (this.touched) {
      const isValid2 = this.validate();
      this.showError = !isValid2;
    }
  }
  /**
   * Render the clear button for clearable inputs with value.
   */
  renderClearButton() {
    return b2`
      <button
        type="button"
        class="clear-button"
        aria-label="Clear input"
        @click=${this.handleClear}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" class="clear-icon">
          ${this.xCircleIcon}
        </svg>
      </button>
    `;
  }
  /**
   * Render the character counter if showCount and maxlength are set.
   */
  renderCharacterCount() {
    if (!this.showCount || !this.maxlength) return A;
    return b2`
      <span class="character-count" part="counter">
        ${this.value.length}/${this.maxlength}
      </span>
    `;
  }
  /**
   * Form lifecycle callback: reset the input to initial state.
   */
  formResetCallback() {
    this.value = "";
    this.touched = false;
    this.showError = false;
    this.passwordVisible = false;
    this.internals?.setFormValue("");
    this.internals?.setValidity({});
  }
  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled) {
    this.disabled = disabled;
  }
  /**
   * Get the CSS classes for the input element.
   */
  getInputClasses() {
    return `input-${this.size}`;
  }
  /**
   * Get the CSS classes for the input container.
   */
  getContainerClasses() {
    const classes = [`container-${this.size}`];
    if (this.showError) {
      classes.push("container-error");
    }
    if (this.disabled) {
      classes.push("container-disabled");
    }
    if (this.readonly) {
      classes.push("container-readonly");
    }
    return classes.join(" ");
  }
  /**
   * Compute aria-describedby value based on error or helper state.
   */
  getAriaDescribedBy() {
    if (this.showError) {
      return `${this.inputId}-error`;
    }
    if (this.helperText) {
      return `${this.inputId}-helper`;
    }
    return A;
  }
  render() {
    return b2`
      <div class="input-wrapper" part="wrapper">
        ${this.label ? b2`
              <label
                for=${this.inputId}
                part="label"
                class="input-label label-${this.size}"
              >
                ${this.label}
                ${this.required ? b2`<span class="required-indicator"
                      >${this.requiredIndicator === "text" ? " (required)" : "*"}</span
                    >` : A}
              </label>
            ` : A}
        ${this.helperText ? b2`
              <span
                id="${this.inputId}-helper"
                part="helper"
                class="helper-text"
                >${this.helperText}</span
              >
            ` : A}

        <div
          class="input-container ${this.getContainerClasses()}"
          part="container"
          @click=${this.handleContainerClick}
        >
          <slot
            name="prefix"
            part="prefix"
            class="input-slot prefix-slot ${this.hasPrefixContent ? "has-content" : ""}"
            @slotchange=${this.handlePrefixSlotChange}
          ></slot>
          <input
            id=${this.inputId}
            part="input"
            class=${this.getInputClasses()}
            type=${this.type === "password" && this.passwordVisible ? "text" : this.type}
            name=${this.name}
            .value=${this.value}
            placeholder=${this.placeholder || A}
            ?required=${this.required}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            minlength=${this.minlength ?? A}
            maxlength=${this.maxlength ?? A}
            min=${this.min ?? A}
            max=${this.max ?? A}
            pattern=${this.pattern || A}
            aria-invalid=${this.showError ? "true" : A}
            aria-describedby=${this.getAriaDescribedBy()}
            @input=${this.handleInput}
            @blur=${this.handleBlur}
          />
          ${this.type === "password" ? this.renderPasswordToggle() : A}
          ${this.clearable && this.value ? this.renderClearButton() : A}
          ${this.renderCharacterCount()}
          <slot
            name="suffix"
            part="suffix"
            class="input-slot suffix-slot ${this.hasSuffixContent ? "has-content" : ""}"
            @slotchange=${this.handleSuffixSlotChange}
          ></slot>
        </div>

        ${this.showError && this.errorMessage ? b2`
              <span
                id="${this.inputId}-error"
                part="error"
                class="error-text"
                role="alert"
                >${this.errorMessage}</span
              >
            ` : A}
        ${this.renderPasswordLiveRegion()}
      </div>
    `;
  }
};
__decorateClass([
  e5("input")
], Input.prototype, "inputEl", 2);
__decorateClass([
  n4({ type: String })
], Input.prototype, "type", 2);
__decorateClass([
  n4({ type: String })
], Input.prototype, "size", 2);
__decorateClass([
  n4({ type: String })
], Input.prototype, "name", 2);
__decorateClass([
  n4({ type: String })
], Input.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], Input.prototype, "placeholder", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Input.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Input.prototype, "readonly", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Input.prototype, "required", 2);
__decorateClass([
  n4({ type: Number })
], Input.prototype, "minlength", 2);
__decorateClass([
  n4({ type: Number })
], Input.prototype, "maxlength", 2);
__decorateClass([
  n4({ type: String })
], Input.prototype, "pattern", 2);
__decorateClass([
  n4({ type: Number })
], Input.prototype, "min", 2);
__decorateClass([
  n4({ type: Number })
], Input.prototype, "max", 2);
__decorateClass([
  n4({ type: String })
], Input.prototype, "label", 2);
__decorateClass([
  n4({ type: String, attribute: "helper-text" })
], Input.prototype, "helperText", 2);
__decorateClass([
  n4({ type: String, attribute: "required-indicator" })
], Input.prototype, "requiredIndicator", 2);
__decorateClass([
  n4({ type: Boolean })
], Input.prototype, "clearable", 2);
__decorateClass([
  n4({ type: Boolean, attribute: "show-count" })
], Input.prototype, "showCount", 2);
__decorateClass([
  r5()
], Input.prototype, "touched", 2);
__decorateClass([
  r5()
], Input.prototype, "showError", 2);
__decorateClass([
  r5()
], Input.prototype, "passwordVisible", 2);
__decorateClass([
  r5()
], Input.prototype, "hasPrefixContent", 2);
__decorateClass([
  r5()
], Input.prototype, "hasSuffixContent", 2);
if (!customElements.get("lui-input")) {
  customElements.define("lui-input", Input);
}

// src/components/ui/textarea.ts
var Textarea = class extends TailwindElement {
  constructor() {
    super();
    /**
     * ElementInternals for form participation.
     * Null during SSR since attachInternals() is not available.
     */
    this.internals = null;
    /**
     * Unique ID for the textarea element, used for label association.
     */
    this.textareaId = `lui-textarea-${Math.random().toString(36).substr(2, 9)}`;
    this.size = "md";
    this.name = "";
    this.value = "";
    this.placeholder = "";
    this.label = "";
    this.helperText = "";
    this.requiredIndicator = "asterisk";
    this.rows = 3;
    this.resize = "vertical";
    this.autoresize = false;
    this.showCount = false;
    this.required = false;
    this.disabled = false;
    this.readonly = false;
    this.touched = false;
    this.showError = false;
    if (!o5) {
      this.internals = this.attachInternals();
    }
  }
  static {
    /**
     * Enable form association for this custom element.
     * This allows the textarea to participate in form submission.
     */
    this.formAssociated = true;
  }
  /**
   * Lifecycle callback when element is first rendered.
   * Sets up initial auto-resize height.
   */
  firstUpdated() {
    if (this.autoresize) {
      this.adjustHeight();
    }
  }
  /**
   * Adjust textarea height to fit content.
   * Only active when autoresize is enabled.
   */
  adjustHeight() {
    if (!this.autoresize || !this.textareaEl) return;
    const textarea = this.textareaEl;
    const minHeight = this.getMinHeight();
    textarea.style.height = "auto";
    let newHeight = textarea.scrollHeight;
    const maxHeightPx = this.getMaxHeightPx();
    if (maxHeightPx && newHeight > maxHeightPx) {
      newHeight = maxHeightPx;
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.overflowY = "hidden";
    }
    if (newHeight < minHeight) {
      newHeight = minHeight;
    }
    textarea.style.height = `${newHeight}px`;
  }
  /**
   * Get minimum height based on rows attribute.
   */
  getMinHeight() {
    const computed = getComputedStyle(this.textareaEl);
    const lineHeight = parseFloat(computed.lineHeight) || 20;
    const paddingTop = parseFloat(computed.paddingTop) || 0;
    const paddingBottom = parseFloat(computed.paddingBottom) || 0;
    const borderTop = parseFloat(computed.borderTopWidth) || 0;
    const borderBottom = parseFloat(computed.borderBottomWidth) || 0;
    return this.rows * lineHeight + paddingTop + paddingBottom + borderTop + borderBottom;
  }
  /**
   * Get max height in pixels from maxHeight or maxRows.
   * maxHeight takes precedence if both are set.
   */
  getMaxHeightPx() {
    if (this.maxHeight) {
      const temp = document.createElement("div");
      temp.style.height = this.maxHeight;
      temp.style.position = "absolute";
      temp.style.visibility = "hidden";
      document.body.appendChild(temp);
      const height = temp.offsetHeight;
      document.body.removeChild(temp);
      return height > 0 ? height : null;
    }
    if (this.maxRows) {
      const computed = getComputedStyle(this.textareaEl);
      const lineHeight = parseFloat(computed.lineHeight) || 20;
      const paddingTop = parseFloat(computed.paddingTop) || 0;
      const paddingBottom = parseFloat(computed.paddingBottom) || 0;
      const borderTop = parseFloat(computed.borderTopWidth) || 0;
      const borderBottom = parseFloat(computed.borderBottomWidth) || 0;
      return this.maxRows * lineHeight + paddingTop + paddingBottom + borderTop + borderBottom;
    }
    return null;
  }
  static {
    /**
     * Static styles for the textarea component.
     * Uses CSS custom properties from Phase 26 tokens.
     */
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: inline-block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      /* Textarea element */
      textarea {
        display: block;
        width: 100%;
        border-radius: var(--ui-input-radius);
        border-width: var(--ui-input-border-width);
        border-style: solid;
        border-color: var(--ui-input-border);
        background-color: var(--ui-input-bg);
        color: var(--ui-input-text);
        transition:
          border-color var(--ui-input-transition),
          box-shadow var(--ui-input-transition);
      }

      textarea::placeholder {
        color: var(--ui-input-placeholder);
      }

      textarea:focus {
        border-color: var(--ui-input-border-focus);
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-textarea-ring));
        outline-offset: 2px;
      }

      /* Error state */
      textarea.textarea-error {
        border-color: var(--ui-input-border-error);
      }

      /* Disabled state */
      textarea:disabled {
        background-color: var(--ui-input-bg-disabled);
        border-color: var(--ui-input-border-disabled);
        color: var(--ui-input-text-disabled);
        cursor: not-allowed;
      }

      /* Readonly state */
      textarea:read-only:not(:disabled) {
        background-color: var(--ui-input-bg-readonly, var(--color-muted));
        cursor: text;
      }

      /* Size variants */
      textarea.textarea-sm {
        padding: var(--ui-input-padding-y-sm) var(--ui-input-padding-x-sm);
        font-size: var(--ui-input-font-size-sm);
      }

      textarea.textarea-md {
        padding: var(--ui-input-padding-y-md) var(--ui-input-padding-x-md);
        font-size: var(--ui-input-font-size-md);
      }

      textarea.textarea-lg {
        padding: var(--ui-input-padding-y-lg) var(--ui-input-padding-x-lg);
        font-size: var(--ui-input-font-size-lg);
      }

      /* Resize variants */
      textarea.resize-none {
        resize: none;
      }

      textarea.resize-vertical {
        resize: vertical;
      }

      textarea.resize-horizontal {
        resize: horizontal;
      }

      textarea.resize-both {
        resize: both;
      }

      /* Auto-resize mode - hide resize handle, smooth transition */
      textarea.autoresize {
        resize: none;
        overflow-y: hidden;
        transition: height 150ms ease-out,
                    border-color var(--ui-input-transition),
                    box-shadow var(--ui-input-transition);
      }

      /* Wrapper for label structure */
      .textarea-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      /* Label styling - scales with size */
      .textarea-label {
        font-weight: 500;
        color: var(--ui-input-text);
      }

      .textarea-label.label-sm {
        font-size: var(--ui-input-font-size-sm);
      }

      .textarea-label.label-md {
        font-size: var(--ui-input-font-size-md);
      }

      .textarea-label.label-lg {
        font-size: var(--ui-input-font-size-lg);
      }

      .required-indicator {
        color: var(--ui-input-text-error);
        margin-left: 0.125rem;
      }

      /* Helper text - below label, above textarea */
      .helper-text {
        font-size: 0.875em;
        color: var(--color-muted-foreground);
      }

      /* Error text - below textarea */
      .error-text {
        font-size: 0.875em;
        color: var(--ui-input-text-error);
      }

      /* Character counter container */
      .textarea-container {
        position: relative;
        display: inline-block;
        width: 100%;
      }

      /* Character counter - positioned inside textarea bottom-right */
      .character-count {
        position: absolute;
        bottom: 0.5rem;
        right: 0.75rem;
        font-size: 0.75rem;
        color: var(--color-muted-foreground);
        pointer-events: none;
        background: var(--ui-input-bg);
        padding: 0 0.25rem;
      }

      /* Extra bottom padding when counter is shown to avoid text overlap */
      textarea.has-counter {
        padding-bottom: 1.75rem;
      }
    `
    ];
  }
  /**
   * Sync the textarea value to the form via ElementInternals.
   */
  updateFormValue() {
    this.internals?.setFormValue(this.value);
  }
  /**
   * Validate the textarea and sync validity state to ElementInternals.
   * Mirrors native textarea validity to the custom element for form participation.
   * @returns true if valid, false if invalid
   */
  validate() {
    const textarea = this.textareaEl;
    if (!textarea || !this.internals) return true;
    const validity = textarea.validity;
    if (!validity.valid) {
      this.internals.setValidity(
        {
          valueMissing: validity.valueMissing,
          tooShort: validity.tooShort,
          tooLong: validity.tooLong
        },
        textarea.validationMessage,
        textarea
        // anchor for popup positioning
      );
      return false;
    }
    this.internals.setValidity({});
    return true;
  }
  /**
   * Get the current validation error message.
   */
  get errorMessage() {
    return this.internals?.validationMessage || "";
  }
  /**
   * Handle input events from the native textarea.
   */
  handleInput(e7) {
    const textarea = e7.target;
    this.value = textarea.value;
    this.updateFormValue();
    if (this.autoresize) {
      this.adjustHeight();
    }
    if (this.touched) {
      const isValid2 = this.validate();
      this.showError = !isValid2;
    }
  }
  /**
   * Handle blur events for validation display timing.
   */
  handleBlur() {
    this.touched = true;
    const isValid2 = this.validate();
    this.showError = !isValid2;
  }
  /**
   * Form lifecycle callback: reset the textarea to initial state.
   */
  formResetCallback() {
    this.value = "";
    this.touched = false;
    this.showError = false;
    this.internals?.setFormValue("");
    this.internals?.setValidity({});
    if (this.autoresize) {
      requestAnimationFrame(() => this.adjustHeight());
    }
  }
  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled) {
    this.disabled = disabled;
  }
  /**
   * Render the character counter if showCount and maxlength are set.
   */
  renderCharacterCount() {
    if (!this.showCount || !this.maxlength) return A;
    return b2`
      <span class="character-count" part="counter">
        ${this.value.length}/${this.maxlength}
      </span>
    `;
  }
  /**
   * Get the CSS classes for the textarea element.
   */
  getTextareaClasses() {
    const classes = [`textarea-${this.size}`];
    if (this.autoresize) {
      classes.push("autoresize");
    } else {
      classes.push(`resize-${this.resize}`);
    }
    if (this.showCount && this.maxlength) {
      classes.push("has-counter");
    }
    if (this.showError) {
      classes.push("textarea-error");
    }
    return classes.join(" ");
  }
  /**
   * Compute aria-describedby value based on error or helper state.
   */
  getAriaDescribedBy() {
    if (this.showError) {
      return `${this.textareaId}-error`;
    }
    if (this.helperText) {
      return `${this.textareaId}-helper`;
    }
    return A;
  }
  render() {
    return b2`
      <div class="textarea-wrapper" part="wrapper">
        ${this.label ? b2`
              <label
                for=${this.textareaId}
                part="label"
                class="textarea-label label-${this.size}"
              >
                ${this.label}
                ${this.required ? b2`<span class="required-indicator"
                      >${this.requiredIndicator === "text" ? " (required)" : "*"}</span
                    >` : A}
              </label>
            ` : A}
        ${this.helperText ? b2`
              <span
                id="${this.textareaId}-helper"
                part="helper"
                class="helper-text"
                >${this.helperText}</span
              >
            ` : A}

        <div class="textarea-container">
          <textarea
            id=${this.textareaId}
            part="textarea"
            class=${this.getTextareaClasses()}
            name=${this.name}
            .value=${this.value}
            placeholder=${this.placeholder || A}
            rows=${this.rows}
            ?required=${this.required}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            minlength=${this.minlength ?? A}
            maxlength=${this.maxlength ?? A}
            aria-invalid=${this.showError ? "true" : A}
            aria-describedby=${this.getAriaDescribedBy()}
            @input=${this.handleInput}
            @blur=${this.handleBlur}
          ></textarea>
          ${this.renderCharacterCount()}
        </div>

        ${this.showError && this.errorMessage ? b2`
              <span
                id="${this.textareaId}-error"
                part="error"
                class="error-text"
                role="alert"
                >${this.errorMessage}</span
              >
            ` : A}
      </div>
    `;
  }
};
__decorateClass([
  e5("textarea")
], Textarea.prototype, "textareaEl", 2);
__decorateClass([
  n4({ type: String })
], Textarea.prototype, "size", 2);
__decorateClass([
  n4({ type: String })
], Textarea.prototype, "name", 2);
__decorateClass([
  n4({ type: String })
], Textarea.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], Textarea.prototype, "placeholder", 2);
__decorateClass([
  n4({ type: String })
], Textarea.prototype, "label", 2);
__decorateClass([
  n4({ type: String, attribute: "helper-text" })
], Textarea.prototype, "helperText", 2);
__decorateClass([
  n4({ type: String, attribute: "required-indicator" })
], Textarea.prototype, "requiredIndicator", 2);
__decorateClass([
  n4({ type: Number })
], Textarea.prototype, "rows", 2);
__decorateClass([
  n4({ type: String })
], Textarea.prototype, "resize", 2);
__decorateClass([
  n4({ type: Boolean })
], Textarea.prototype, "autoresize", 2);
__decorateClass([
  n4({ type: Number, attribute: "max-rows" })
], Textarea.prototype, "maxRows", 2);
__decorateClass([
  n4({ type: String, attribute: "max-height" })
], Textarea.prototype, "maxHeight", 2);
__decorateClass([
  n4({ type: Number })
], Textarea.prototype, "minlength", 2);
__decorateClass([
  n4({ type: Number })
], Textarea.prototype, "maxlength", 2);
__decorateClass([
  n4({ type: Boolean, attribute: "show-count" })
], Textarea.prototype, "showCount", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Textarea.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Textarea.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Textarea.prototype, "readonly", 2);
__decorateClass([
  r5()
], Textarea.prototype, "touched", 2);
__decorateClass([
  r5()
], Textarea.prototype, "showError", 2);
if (!customElements.get("lui-textarea")) {
  customElements.define("lui-textarea", Textarea);
}

// src/components/ui/checkbox.ts
var Checkbox = class extends TailwindElement {
  constructor() {
    super();
    /**
     * ElementInternals for form participation.
     * Null during SSR since attachInternals() is not available.
     */
    this.internals = null;
    /**
     * Unique ID for label association.
     */
    this.checkboxId = `lui-cb-${Math.random().toString(36).substr(2, 9)}`;
    /**
     * Stores the initial checked state for formResetCallback.
     */
    this.defaultChecked = false;
    this.checked = false;
    this.disabled = false;
    this.required = false;
    this.indeterminate = false;
    this.name = "";
    this.value = "on";
    this.label = "";
    this.size = "md";
    this.touched = false;
    this.showError = false;
    if (!o5) {
      this.internals = this.attachInternals();
    }
  }
  static {
    /**
     * Enable form association for this custom element.
     * This allows the checkbox to participate in form submission.
     */
    this.formAssociated = true;
  }
  connectedCallback() {
    super.connectedCallback();
    this.defaultChecked = this.checked;
    this.updateFormValue();
  }
  /**
   * Keep form state in sync when checked or indeterminate property changes externally.
   */
  updated(changedProperties) {
    if (changedProperties.has("checked") || changedProperties.has("indeterminate")) {
      this.updateFormValue();
      this.validate();
    }
  }
  static {
    /**
     * Static styles for the checkbox component.
     * Uses CSS custom properties from the checkbox token block.
     */
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: inline-block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      /* Checkbox wrapper - flexbox row for label + box */
      .checkbox-wrapper {
        display: flex;
        flex-direction: row;
        gap: var(--ui-checkbox-label-gap);
        align-items: center;
        cursor: pointer;
      }

      /* Checkbox box - the square container */
      .checkbox-box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: var(--ui-checkbox-border-width) solid var(--ui-checkbox-border);
        border-radius: var(--ui-checkbox-radius);
        background-color: var(--ui-checkbox-bg);
        cursor: pointer;
        transition:
          background-color var(--ui-checkbox-transition) ease-in-out,
          border-color var(--ui-checkbox-transition) ease-in-out;
        flex-shrink: 0;
        color: var(--ui-checkbox-check-color);
      }

      /* Checked and indeterminate states */
      .checkbox-box[aria-checked='true'],
      .checkbox-box[aria-checked='mixed'] {
        background-color: var(--ui-checkbox-bg-checked);
        border-color: var(--ui-checkbox-border-checked);
      }

      /* SVG icon sizing */
      .checkbox-icon {
        width: 75%;
        height: 75%;
      }

      /* Checkmark draw-in animation via stroke-dashoffset */
      .check-path {
        stroke-dasharray: 14;
        stroke-dashoffset: 14;
        transition: stroke-dashoffset var(--ui-checkbox-transition) ease-in-out;
      }

      /* When checked: draw in (offset to 0) */
      .checkbox-box[aria-checked='true'] .check-path {
        stroke-dashoffset: 0;
      }

      /* Indeterminate dash - use opacity for cross-fade */
      .dash-path {
        opacity: 0;
        transition: opacity var(--ui-checkbox-transition) ease-in-out;
      }

      .checkbox-box[aria-checked='mixed'] .dash-path {
        opacity: 1;
      }

      /* Hide checkmark when indeterminate */
      .checkbox-box[aria-checked='mixed'] .check-path {
        stroke-dashoffset: 14;
      }

      /* Size: sm */
      .box-sm {
        width: var(--ui-checkbox-size-sm);
        height: var(--ui-checkbox-size-sm);
      }

      /* Size: md */
      .box-md {
        width: var(--ui-checkbox-size-md);
        height: var(--ui-checkbox-size-md);
      }

      /* Size: lg */
      .box-lg {
        width: var(--ui-checkbox-size-lg);
        height: var(--ui-checkbox-size-lg);
      }

      /* Focus ring */
      .checkbox-box:focus-visible {
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-checkbox-ring));
        outline-offset: 2px;
      }

      /* Disabled */
      .checkbox-box[aria-disabled='true'] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Label */
      .checkbox-label {
        font-weight: 500;
        color: var(--ui-input-text, inherit);
        cursor: pointer;
      }

      .label-sm {
        font-size: var(--ui-checkbox-font-size-sm);
      }

      .label-md {
        font-size: var(--ui-checkbox-font-size-md);
      }

      .label-lg {
        font-size: var(--ui-checkbox-font-size-lg);
      }

      /* Error text */
      .error-text {
        font-size: 0.75rem;
        color: var(--ui-checkbox-text-error);
        margin-top: 0.25rem;
      }

      /* Error border */
      .checkbox-box.has-error {
        border-color: var(--ui-checkbox-border-error);
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .check-path,
        .dash-path,
        .checkbox-box {
          transition-duration: 0ms;
        }
      }
    `
    ];
  }
  /**
   * Toggle the checkbox state.
   * Always clears indeterminate on user interaction.
   * Dispatches ui-change event with checked state and value.
   */
  toggle() {
    if (this.disabled) return;
    this.indeterminate = false;
    this.checked = !this.checked;
    this.touched = true;
    this.updateFormValue();
    this.validate();
    dispatchCustomEvent(this, "ui-change", {
      checked: this.checked,
      value: this.checked ? this.value : null
    });
  }
  /**
   * Handle click events on the checkbox wrapper.
   * Click handler is on the wrapper so clicking the label also toggles.
   */
  handleClick() {
    this.toggle();
  }
  /**
   * Handle keyboard events for Space key only.
   * Per W3C APG checkbox spec, Space toggles the checkbox.
   * Enter is NOT specified for checkbox (unlike switch).
   * preventDefault stops page scroll on Space.
   */
  handleKeyDown(e7) {
    if (e7.key === " ") {
      e7.preventDefault();
      this.toggle();
    }
  }
  /**
   * Sync the checked state to the form via ElementInternals.
   * Submits value when checked, null when unchecked.
   * Indeterminate does NOT affect form value.
   */
  updateFormValue() {
    this.internals?.setFormValue(this.checked ? this.value : null);
  }
  /**
   * Validate the checkbox and sync validity state to ElementInternals.
   * @returns true if valid, false if invalid
   */
  validate() {
    if (!this.internals) return true;
    if (this.required && !this.checked) {
      this.internals.setValidity(
        { valueMissing: true },
        "Please check this box.",
        this.shadowRoot?.querySelector(".checkbox-box")
      );
      this.showError = this.touched;
      return false;
    }
    this.internals.setValidity({});
    this.showError = false;
    return true;
  }
  /**
   * Form lifecycle callback: reset the checkbox to initial state.
   */
  formResetCallback() {
    this.checked = this.defaultChecked;
    this.indeterminate = false;
    this.touched = false;
    this.showError = false;
    this.updateFormValue();
    this.internals?.setValidity({});
  }
  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled) {
    this.disabled = disabled;
  }
  render() {
    return b2`
      <div class="checkbox-wrapper" @click=${this.handleClick}>
        <div
          role="checkbox"
          aria-checked=${this.indeterminate ? "mixed" : this.checked ? "true" : "false"}
          aria-disabled=${this.disabled ? "true" : A}
          aria-required=${this.required ? "true" : A}
          aria-labelledby="${this.checkboxId}-label"
          tabindex=${this.disabled ? "-1" : "0"}
          class="checkbox-box box-${this.size} ${this.showError ? "has-error" : ""}"
          @keydown=${this.handleKeyDown}
        >
          <svg
            class="checkbox-icon"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              class="check-path"
              d="M2 6L5 9L10 3"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              class="dash-path"
              d="M3 6H9"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </div>
        ${this.label ? b2`<label
              id="${this.checkboxId}-label"
              class="checkbox-label label-${this.size}"
              >${this.label}</label
            >` : b2`<label
              id="${this.checkboxId}-label"
              class="checkbox-label label-${this.size}"
              ><slot></slot
            ></label>`}
      </div>
      ${this.showError ? b2`<div class="error-text" role="alert">
            Please check this box.
          </div>` : A}
    `;
  }
};
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Checkbox.prototype, "checked", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Checkbox.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Checkbox.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean })
], Checkbox.prototype, "indeterminate", 2);
__decorateClass([
  n4({ type: String })
], Checkbox.prototype, "name", 2);
__decorateClass([
  n4({ type: String })
], Checkbox.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], Checkbox.prototype, "label", 2);
__decorateClass([
  n4({ type: String })
], Checkbox.prototype, "size", 2);
__decorateClass([
  r5()
], Checkbox.prototype, "touched", 2);
__decorateClass([
  r5()
], Checkbox.prototype, "showError", 2);
if (!customElements.get("lui-checkbox")) {
  customElements.define("lui-checkbox", Checkbox);
}

// src/components/ui/checkbox-group.ts
var CheckboxGroup = class extends TailwindElement {
  constructor() {
    super(...arguments);
    // NOT form-associated — children submit themselves
    /**
     * Unique ID for label association.
     */
    this.groupId = `lui-cbg-${Math.random().toString(36).substr(2, 9)}`;
    /**
     * Discovered child checkboxes (NOT including select-all).
     */
    this.checkboxes = [];
    /**
     * Flag to prevent select-all race condition during batch updates.
     * When true, handleChildChange skips recalculation (Pitfall 6).
     */
    this._batchUpdating = false;
    /**
     * Reference to the internal select-all checkbox element.
     */
    this.selectAllEl = null;
    this.label = "";
    this.disabled = false;
    this.required = false;
    this.error = "";
    this.selectAll = false;
    this.showError = false;
  }
  static {
    /**
     * Static styles for the checkbox group component.
     */
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: block;
      }

      :host([disabled]) {
        opacity: 0.5;
      }

      .group-wrapper {
        display: flex;
        flex-direction: column;
      }

      .group-label {
        font-weight: 500;
        margin-bottom: 0.375rem;
        font-size: 0.875rem;
        color: var(--ui-input-text, inherit);
      }

      .group-items {
        display: flex;
        flex-direction: column;
        gap: var(--ui-checkbox-group-gap);
      }

      .select-all-wrapper {
        padding-bottom: var(--ui-checkbox-group-gap);
        border-bottom: 1px solid var(--ui-checkbox-border);
        margin-bottom: var(--ui-checkbox-group-gap);
      }

      .error-text {
        font-size: 0.75rem;
        color: var(--ui-checkbox-text-error);
        margin-top: 0.25rem;
      }
    `
    ];
  }
  /**
   * Sync disabled state and select-all reference when properties change.
   */
  updated(changedProperties) {
    if (changedProperties.has("disabled")) {
      this.syncDisabledState();
    }
    if (changedProperties.has("selectAll") || changedProperties.has("disabled")) {
      if (this.selectAll) {
        this.selectAllEl = this.shadowRoot?.querySelector(
          ".select-all-wrapper lui-checkbox"
        );
        this.updateSelectAllState();
      } else {
        this.selectAllEl = null;
      }
    }
  }
  /**
   * Handle slot changes to discover child checkboxes.
   * Filters for LUI-CHECKBOX elements and syncs disabled state.
   */
  handleSlotChange(e7) {
    const slot = e7.target;
    const assigned = slot.assignedElements({ flatten: true });
    this.checkboxes = assigned.filter(
      (el) => el.tagName === "LUI-CHECKBOX"
    );
    this.syncDisabledState();
    this.updateSelectAllState();
  }
  /**
   * Propagate disabled state to all child checkboxes.
   * Called when disabled property changes or children are discovered.
   */
  syncDisabledState() {
    if (this.disabled) {
      this.checkboxes.forEach((cb) => {
        cb.disabled = true;
      });
    }
  }
  /**
   * Handle ui-change events bubbling from child checkboxes.
   * Skips during batch updates to prevent race conditions (Pitfall 6).
   */
  handleChildChange() {
    if (this._batchUpdating) return;
    if (this.selectAll) {
      this.updateSelectAllState();
    }
    this.validateGroup();
  }
  /**
   * Update the select-all checkbox to reflect the aggregate state of children.
   * - All checked: checked=true, indeterminate=false
   * - None checked: checked=false, indeterminate=false
   * - Some checked: checked=false, indeterminate=true
   */
  updateSelectAllState() {
    if (!this.selectAllEl || this.checkboxes.length === 0) return;
    const enabled = this.checkboxes.filter((cb) => !cb.disabled);
    const checkedCount = enabled.filter((cb) => cb.checked).length;
    const total = enabled.length;
    if (checkedCount === 0) {
      this.selectAllEl.checked = false;
      this.selectAllEl.indeterminate = false;
    } else if (checkedCount === total) {
      this.selectAllEl.checked = true;
      this.selectAllEl.indeterminate = false;
    } else {
      this.selectAllEl.checked = false;
      this.selectAllEl.indeterminate = true;
    }
  }
  /**
   * Handle the select-all checkbox toggle.
   * Uses batch update flag to prevent race conditions (Pitfall 6).
   * Stops propagation to prevent handleChildChange from also firing.
   */
  handleSelectAllToggle(e7) {
    e7.stopPropagation();
    const shouldCheck = !this.checkboxes.filter((cb) => !cb.disabled).every((cb) => cb.checked);
    this._batchUpdating = true;
    this.checkboxes.forEach((cb) => {
      if (!cb.disabled) {
        cb.checked = shouldCheck;
      }
    });
    this._batchUpdating = false;
    this.updateSelectAllState();
    this.validateGroup();
    dispatchCustomEvent(this, "ui-change", {
      allChecked: shouldCheck,
      checkedCount: this.checkboxes.filter((cb) => cb.checked).length,
      totalCount: this.checkboxes.length
    });
  }
  /**
   * Validate group-level required constraint.
   * Shows error if required and no children are checked.
   */
  validateGroup() {
    if (this.required && !this.checkboxes.some((cb) => cb.checked)) {
      this.showError = true;
    } else {
      this.showError = false;
    }
  }
  render() {
    return b2`
      <div
        class="group-wrapper"
        role="group"
        aria-labelledby="${this.groupId}-label"
        @ui-change=${this.handleChildChange}
      >
        ${this.label ? b2`<span id="${this.groupId}-label" class="group-label"
              >${this.label}</span
            >` : A}
        ${this.selectAll ? b2`
              <div class="select-all-wrapper">
                <lui-checkbox
                  label="Select all"
                  @ui-change=${this.handleSelectAllToggle}
                  .disabled=${this.disabled}
                ></lui-checkbox>
              </div>
            ` : A}
        <div class="group-items">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
        ${this.showError ? b2`<div class="error-text" role="alert">
              ${this.error || "Please select at least one option."}
            </div>` : A}
      </div>
    `;
  }
};
__decorateClass([
  n4({ type: String })
], CheckboxGroup.prototype, "label", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], CheckboxGroup.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean })
], CheckboxGroup.prototype, "required", 2);
__decorateClass([
  n4({ type: String })
], CheckboxGroup.prototype, "error", 2);
__decorateClass([
  n4({ type: Boolean, attribute: "select-all" })
], CheckboxGroup.prototype, "selectAll", 2);
__decorateClass([
  r5()
], CheckboxGroup.prototype, "showError", 2);
if (!customElements.get("lui-checkbox-group")) {
  customElements.define("lui-checkbox-group", CheckboxGroup);
}

// src/components/ui/radio.ts
var Radio = class extends TailwindElement {
  constructor() {
    super(...arguments);
    // NOT form-associated -- RadioGroup owns form participation
    // NO internals / attachInternals()
    /**
     * Unique ID for label association.
     */
    this.radioId = `lui-radio-${Math.random().toString(36).substr(2, 9)}`;
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.label = "";
    this.size = "md";
  }
  static {
    /**
     * Static styles for the radio component.
     * Uses CSS custom properties from the radio token block.
     */
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: inline-block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      /* Radio wrapper - flexbox row for label + circle */
      .radio-wrapper {
        display: flex;
        flex-direction: row;
        gap: var(--ui-radio-label-gap);
        align-items: center;
        cursor: pointer;
      }

      /* Radio circle - the outer border */
      .radio-circle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: var(--ui-radio-border-width) solid var(--ui-radio-border);
        border-radius: 50%;
        background-color: var(--ui-radio-bg);
        cursor: pointer;
        transition: border-color var(--ui-radio-transition) ease-in-out;
        flex-shrink: 0;
      }

      /* Checked state */
      .radio-circle[aria-checked='true'] {
        border-color: var(--ui-radio-border-checked);
      }

      /* Inner dot */
      .radio-dot {
        border-radius: 50%;
        background-color: var(--ui-radio-dot-color);
        transform: scale(0);
        transition: transform var(--ui-radio-transition) ease-in-out;
      }

      /* Dot visible when checked */
      .radio-circle[aria-checked='true'] .radio-dot {
        transform: scale(1);
      }

      /* Size: sm */
      .circle-sm {
        width: var(--ui-radio-size-sm);
        height: var(--ui-radio-size-sm);
      }

      .dot-sm {
        width: var(--ui-radio-dot-size-sm);
        height: var(--ui-radio-dot-size-sm);
      }

      /* Size: md */
      .circle-md {
        width: var(--ui-radio-size-md);
        height: var(--ui-radio-size-md);
      }

      .dot-md {
        width: var(--ui-radio-dot-size-md);
        height: var(--ui-radio-dot-size-md);
      }

      /* Size: lg */
      .circle-lg {
        width: var(--ui-radio-size-lg);
        height: var(--ui-radio-size-lg);
      }

      .dot-lg {
        width: var(--ui-radio-dot-size-lg);
        height: var(--ui-radio-dot-size-lg);
      }

      /* Focus ring */
      .radio-circle:focus-visible {
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-radio-ring));
        outline-offset: 2px;
      }

      /* Disabled */
      .radio-circle[aria-disabled='true'] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Label */
      .radio-label {
        font-weight: 500;
        color: var(--ui-input-text, inherit);
        cursor: pointer;
      }

      .label-sm {
        font-size: var(--ui-radio-font-size-sm);
      }

      .label-md {
        font-size: var(--ui-radio-font-size-md);
      }

      .label-lg {
        font-size: var(--ui-radio-font-size-lg);
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .radio-dot,
        .radio-circle {
          transition-duration: 0ms;
        }
      }
    `
    ];
  }
  /**
   * Handle click events on the radio wrapper.
   * Click handler is on the wrapper so clicking the label also triggers selection.
   * Radio does NOT toggle its own checked state -- it dispatches ui-radio-change
   * and the RadioGroup handles mutual exclusion.
   */
  handleClick() {
    if (this.disabled) return;
    dispatchCustomEvent(this, "ui-radio-change", {
      value: this.value
    });
  }
  /**
   * Handle keyboard events for Space key only.
   * Per W3C APG radio spec, Space checks the focused radio.
   * Arrow keys are handled by the RadioGroup, not individual radios.
   * preventDefault stops page scroll on Space.
   */
  handleKeyDown(e7) {
    if (e7.key === " ") {
      e7.preventDefault();
      this.handleClick();
    }
  }
  render() {
    return b2`
      <div class="radio-wrapper" @click=${this.handleClick}>
        <div
          role="radio"
          aria-checked=${this.checked ? "true" : "false"}
          aria-disabled=${this.disabled ? "true" : A}
          aria-labelledby="${this.radioId}-label"
          tabindex="-1"
          class="radio-circle circle-${this.size}"
          @keydown=${this.handleKeyDown}
        >
          <span class="radio-dot dot-${this.size}"></span>
        </div>
        ${this.label ? b2`<label
              id="${this.radioId}-label"
              class="radio-label label-${this.size}"
              >${this.label}</label
            >` : b2`<label
              id="${this.radioId}-label"
              class="radio-label label-${this.size}"
              ><slot></slot
            ></label>`}
      </div>
    `;
  }
};
__decorateClass([
  n4({ type: String })
], Radio.prototype, "value", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Radio.prototype, "checked", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Radio.prototype, "disabled", 2);
__decorateClass([
  n4({ type: String })
], Radio.prototype, "label", 2);
__decorateClass([
  n4({ type: String })
], Radio.prototype, "size", 2);
if (!customElements.get("lui-radio")) {
  customElements.define("lui-radio", Radio);
}

// src/components/ui/radio-group.ts
var RadioGroup = class extends TailwindElement {
  constructor() {
    super();
    /**
     * ElementInternals for form participation.
     * Null during SSR since attachInternals() is not available.
     */
    this.internals = null;
    /**
     * Unique ID for label association.
     */
    this.groupId = `lui-rg-${Math.random().toString(36).substr(2, 9)}`;
    /**
     * Discovered child radio elements.
     */
    this.radios = [];
    /**
     * Stores the initial value for formResetCallback.
     */
    this.defaultValue = "";
    this.name = "";
    this.value = "";
    this.required = false;
    this.disabled = false;
    this.label = "";
    this.error = "";
    this.touched = false;
    this.showError = false;
    if (!o5) {
      this.internals = this.attachInternals();
    }
  }
  static {
    /**
     * Enable form association for this custom element.
     * RadioGroup owns form participation (individual radios do not).
     */
    this.formAssociated = true;
  }
  static {
    /**
     * Static styles for the radio group component.
     */
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: block;
      }

      :host([disabled]) {
        opacity: 0.5;
      }

      .group-wrapper {
        display: flex;
        flex-direction: column;
      }

      .group-label {
        font-weight: 500;
        margin-bottom: 0.375rem;
        font-size: 0.875rem;
        color: var(--ui-input-text, inherit);
      }

      .group-items {
        display: flex;
        flex-direction: column;
        gap: var(--ui-radio-group-gap);
      }

      .error-text {
        font-size: 0.75rem;
        color: var(--ui-radio-text-error);
        margin-top: 0.25rem;
      }
    `
    ];
  }
  connectedCallback() {
    super.connectedCallback();
    this.defaultValue = this.value;
    this.updateFormValue();
  }
  /**
   * Sync child states and form value when properties change.
   * Uses PropertyValues type (not Map) to avoid api-extractor DTS rollup crash.
   */
  updated(changedProperties) {
    if (changedProperties.has("value")) {
      this.syncChildStates();
      this.updateRovingTabindex();
      this.updateFormValue();
      this.validate();
    }
    if (changedProperties.has("disabled")) {
      this.syncDisabledState();
      this.updateRovingTabindex();
    }
  }
  /**
   * Handle slot changes to discover child radio elements.
   * Filters for LUI-RADIO elements and syncs state.
   */
  handleSlotChange(e7) {
    const slot = e7.target;
    const assigned = slot.assignedElements({ flatten: true });
    this.radios = assigned.filter(
      (el) => el.tagName === "LUI-RADIO"
    );
    this.syncChildStates();
    this.syncDisabledState();
    this.updateRovingTabindex();
  }
  /**
   * Enforce mutual exclusion: only the radio matching group value is checked.
   */
  syncChildStates() {
    for (const radio of this.radios) {
      radio.checked = radio.value === this.value;
    }
  }
  /**
   * Propagate disabled state to all child radios.
   * Called when disabled property changes or children are discovered.
   */
  syncDisabledState() {
    if (this.disabled) {
      this.radios.forEach((r6) => {
        r6.disabled = true;
      });
    }
  }
  /**
   * Manage roving tabindex: only the checked (or first enabled) radio gets tabindex 0.
   * All other radios get tabindex -1. This creates a single tab stop for the group.
   */
  updateRovingTabindex() {
    const enabledRadios = this.radios.filter((r6) => !r6.disabled);
    if (enabledRadios.length === 0) return;
    const checkedRadio = enabledRadios.find((r6) => r6.checked);
    const focusTarget = checkedRadio || enabledRadios[0];
    for (const radio of this.radios) {
      radio.tabIndex = radio === focusTarget && !radio.disabled ? 0 : -1;
    }
  }
  /**
   * Handle arrow key navigation within the group.
   * Arrow keys move focus AND selection simultaneously with wrapping.
   */
  handleKeyDown(e7) {
    const arrowKeys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
    if (!arrowKeys.includes(e7.key)) return;
    e7.preventDefault();
    const enabledRadios = this.radios.filter((r6) => !r6.disabled);
    if (enabledRadios.length === 0) return;
    const currentIndex = enabledRadios.findIndex((r6) => r6.tabIndex === 0);
    const forward = e7.key === "ArrowDown" || e7.key === "ArrowRight";
    const nextIndex = forward ? (currentIndex + 1) % enabledRadios.length : (currentIndex - 1 + enabledRadios.length) % enabledRadios.length;
    const nextRadio = enabledRadios[nextIndex];
    this.value = nextRadio.value;
    this.touched = true;
    this.syncChildStates();
    this.updateRovingTabindex();
    this.updateFormValue();
    this.validate();
    nextRadio.focus();
    dispatchCustomEvent(this, "ui-change", {
      value: this.value
    });
  }
  /**
   * Handle internal ui-radio-change events from child radios.
   * Stops propagation (internal event) and dispatches consumer-facing ui-change.
   */
  handleRadioChange(e7) {
    e7.stopPropagation();
    this.value = e7.detail.value;
    this.touched = true;
    this.syncChildStates();
    this.updateRovingTabindex();
    this.updateFormValue();
    this.validate();
    dispatchCustomEvent(this, "ui-change", {
      value: this.value
    });
  }
  /**
   * Sync the selected value to the form via ElementInternals.
   * Submits value when selected, null when nothing selected.
   */
  updateFormValue() {
    this.internals?.setFormValue(this.value || null);
  }
  /**
   * Validate required constraint and sync validity to ElementInternals.
   * @returns true if valid, false if invalid
   */
  validate() {
    if (!this.internals) return true;
    if (this.required && !this.value) {
      this.internals.setValidity(
        { valueMissing: true },
        this.error || "Please select an option.",
        this.radios[0] || this.shadowRoot?.querySelector(".group-items")
      );
      this.showError = this.touched;
      return false;
    }
    this.internals.setValidity({});
    this.showError = false;
    return true;
  }
  /**
   * Form lifecycle callback: reset the group to initial value.
   */
  formResetCallback() {
    this.value = this.defaultValue;
    this.syncChildStates();
    this.updateRovingTabindex();
    this.updateFormValue();
    this.touched = false;
    this.showError = false;
    this.internals?.setValidity({});
  }
  /**
   * Form lifecycle callback: handle disabled state from fieldset or form.
   */
  formDisabledCallback(disabled) {
    this.disabled = disabled;
    this.syncDisabledState();
    this.updateRovingTabindex();
  }
  render() {
    return b2`
      <div
        class="group-wrapper"
        role="radiogroup"
        aria-labelledby="${this.groupId}-label"
        aria-required=${this.required ? "true" : A}
        @ui-radio-change=${this.handleRadioChange}
        @keydown=${this.handleKeyDown}
      >
        ${this.label ? b2`<span id="${this.groupId}-label" class="group-label"
              >${this.label}</span
            >` : A}
        <div class="group-items">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
        ${this.showError ? b2`<div class="error-text" role="alert">
              ${this.error || "Please select an option."}
            </div>` : A}
      </div>
    `;
  }
};
__decorateClass([
  n4({ type: String })
], RadioGroup.prototype, "name", 2);
__decorateClass([
  n4({ type: String })
], RadioGroup.prototype, "value", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], RadioGroup.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], RadioGroup.prototype, "disabled", 2);
__decorateClass([
  n4({ type: String })
], RadioGroup.prototype, "label", 2);
__decorateClass([
  n4({ type: String })
], RadioGroup.prototype, "error", 2);
__decorateClass([
  r5()
], RadioGroup.prototype, "touched", 2);
__decorateClass([
  r5()
], RadioGroup.prototype, "showError", 2);
if (!customElements.get("lui-radio-group")) {
  customElements.define("lui-radio-group", RadioGroup);
}

// src/components/ui/switch.ts
var Switch = class extends TailwindElement {
  constructor() {
    super();
    /**
     * ElementInternals for form participation.
     * Null during SSR since attachInternals() is not available.
     */
    this.internals = null;
    /**
     * Unique ID for label association.
     */
    this.switchId = `lui-switch-${Math.random().toString(36).substr(2, 9)}`;
    /**
     * Stores the initial checked state for formResetCallback.
     */
    this.defaultChecked = false;
    this.checked = false;
    this.disabled = false;
    this.required = false;
    this.name = "";
    this.value = "on";
    this.label = "";
    this.size = "md";
    this.touched = false;
    this.showError = false;
    if (!o5) {
      this.internals = this.attachInternals();
    }
  }
  static {
    /**
     * Enable form association for this custom element.
     * This allows the switch to participate in form submission.
     */
    this.formAssociated = true;
  }
  connectedCallback() {
    super.connectedCallback();
    this.defaultChecked = this.checked;
    this.updateFormValue();
  }
  /**
   * Keep form state in sync when checked property changes externally.
   */
  updated(changedProperties) {
    if (changedProperties.has("checked")) {
      this.updateFormValue();
      this.validate();
    }
  }
  static {
    /**
     * Static styles for the switch component.
     * Uses CSS custom properties from the switch token block.
     */
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: inline-block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      /* Switch wrapper - flexbox row for label + track */
      .switch-wrapper {
        display: flex;
        flex-direction: row;
        gap: var(--ui-switch-label-gap);
        align-items: center;
      }

      /* Track - the oval background */
      .switch-track {
        display: inline-flex;
        align-items: center;
        position: relative;
        border-radius: var(--ui-switch-radius);
        background-color: var(--ui-switch-track-bg);
        cursor: pointer;
        border: 1px solid var(--ui-switch-track-border);
        transition: background-color var(--ui-switch-transition) ease-in-out;
        flex-shrink: 0;
      }

      .switch-track[aria-checked='true'] {
        background-color: var(--ui-switch-track-bg-checked);
        border-color: var(--ui-switch-track-bg-checked);
      }

      .switch-track[aria-disabled='true'] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Thumb - the sliding circle */
      .switch-thumb {
        position: absolute;
        left: var(--ui-switch-thumb-offset);
        top: 50%;
        transform: translateY(-50%);
        border-radius: var(--ui-switch-thumb-radius);
        background-color: var(--ui-switch-thumb-bg);
        transition: transform var(--ui-switch-transition) ease-in-out;
      }

      /* Size: sm */
      .track-sm {
        width: var(--ui-switch-track-width-sm);
        height: var(--ui-switch-track-height-sm);
      }

      .track-sm .switch-thumb {
        width: var(--ui-switch-thumb-size-sm);
        height: var(--ui-switch-thumb-size-sm);
      }

      .track-sm[aria-checked='true'] .switch-thumb {
        transform: translateX(
            calc(
              var(--ui-switch-track-width-sm) - var(--ui-switch-thumb-size-sm) -
                var(--ui-switch-thumb-offset) * 2
            )
          )
          translateY(-50%);
      }

      /* Size: md */
      .track-md {
        width: var(--ui-switch-track-width-md);
        height: var(--ui-switch-track-height-md);
      }

      .track-md .switch-thumb {
        width: var(--ui-switch-thumb-size-md);
        height: var(--ui-switch-thumb-size-md);
      }

      .track-md[aria-checked='true'] .switch-thumb {
        transform: translateX(
            calc(
              var(--ui-switch-track-width-md) - var(--ui-switch-thumb-size-md) -
                var(--ui-switch-thumb-offset) * 2
            )
          )
          translateY(-50%);
      }

      /* Size: lg */
      .track-lg {
        width: var(--ui-switch-track-width-lg);
        height: var(--ui-switch-track-height-lg);
      }

      .track-lg .switch-thumb {
        width: var(--ui-switch-thumb-size-lg);
        height: var(--ui-switch-thumb-size-lg);
      }

      .track-lg[aria-checked='true'] .switch-thumb {
        transform: translateX(
            calc(
              var(--ui-switch-track-width-lg) - var(--ui-switch-thumb-size-lg) -
                var(--ui-switch-thumb-offset) * 2
            )
          )
          translateY(-50%);
      }

      /* Focus ring */
      .switch-track:focus-visible {
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-switch-ring));
        outline-offset: 2px;
      }

      /* Error state */
      .switch-track.has-error {
        border-color: var(--ui-switch-border-error);
      }

      /* Label */
      .switch-label {
        font-weight: 500;
        color: var(--ui-input-text, inherit);
      }

      .label-sm {
        font-size: var(--ui-switch-font-size-sm);
      }

      .label-md {
        font-size: var(--ui-switch-font-size-md);
      }

      .label-lg {
        font-size: var(--ui-switch-font-size-lg);
      }

      /* Error text */
      .error-text {
        font-size: 0.75rem;
        color: var(--ui-switch-text-error);
        margin-top: 0.25rem;
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .switch-thumb,
        .switch-track {
          transition-duration: 0ms;
        }
      }
    `
    ];
  }
  /**
   * Toggle the switch state.
   * Dispatches ui-change event with checked state and value.
   */
  toggle() {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.touched = true;
    this.updateFormValue();
    this.validate();
    dispatchCustomEvent(this, "ui-change", {
      checked: this.checked,
      value: this.checked ? this.value : null
    });
  }
  /**
   * Handle click events on the switch track.
   */
  handleClick() {
    this.toggle();
  }
  /**
   * Handle keyboard events for Space and Enter keys.
   * Prevents default to avoid page scroll on Space.
   */
  handleKeyDown(e7) {
    if (e7.key === " " || e7.key === "Enter") {
      e7.preventDefault();
      this.toggle();
    }
  }
  /**
   * Sync the checked state to the form via ElementInternals.
   * Submits value when checked, null when unchecked (matches native checkbox).
   */
  updateFormValue() {
    this.internals?.setFormValue(this.checked ? this.value : null);
  }
  /**
   * Validate the switch and sync validity state to ElementInternals.
   * @returns true if valid, false if invalid
   */
  validate() {
    if (!this.internals) return true;
    if (this.required && !this.checked) {
      this.internals.setValidity(
        { valueMissing: true },
        "Please toggle this switch.",
        this.shadowRoot?.querySelector(".switch-track")
      );
      this.showError = this.touched;
      return false;
    }
    this.internals.setValidity({});
    this.showError = false;
    return true;
  }
  /**
   * Form lifecycle callback: reset the switch to initial state.
   */
  formResetCallback() {
    this.checked = this.defaultChecked;
    this.touched = false;
    this.showError = false;
    this.updateFormValue();
    this.internals?.setValidity({});
  }
  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled) {
    this.disabled = disabled;
  }
  render() {
    return b2`
      <div class="switch-wrapper">
        ${this.label ? b2`<label
              id="${this.switchId}-label"
              class="switch-label label-${this.size}"
              >${this.label}</label
            >` : b2`<label
              id="${this.switchId}-label"
              class="switch-label label-${this.size}"
              ><slot></slot
            ></label>`}
        <div
          role="switch"
          aria-checked=${this.checked ? "true" : "false"}
          aria-disabled=${this.disabled ? "true" : A}
          aria-required=${this.required ? "true" : A}
          aria-labelledby="${this.switchId}-label"
          tabindex=${this.disabled ? "-1" : "0"}
          class="switch-track track-${this.size} ${this.showError ? "has-error" : ""}"
          @click=${this.handleClick}
          @keydown=${this.handleKeyDown}
        >
          <span class="switch-thumb"></span>
        </div>
      </div>
      ${this.showError ? b2`<div class="error-text" role="alert">
            Please toggle this switch.
          </div>` : A}
    `;
  }
};
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Switch.prototype, "checked", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Switch.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Switch.prototype, "required", 2);
__decorateClass([
  n4({ type: String })
], Switch.prototype, "name", 2);
__decorateClass([
  n4({ type: String })
], Switch.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], Switch.prototype, "label", 2);
__decorateClass([
  n4({ type: String })
], Switch.prototype, "size", 2);
__decorateClass([
  r5()
], Switch.prototype, "touched", 2);
__decorateClass([
  r5()
], Switch.prototype, "showError", 2);
if (!customElements.get("lui-switch")) {
  customElements.define("lui-switch", Switch);
}

// src/components/ui/accordion.ts
var Accordion = class extends TailwindElement {
  constructor() {
    super(...arguments);
    /**
     * Discovered child accordion item elements.
     */
    this.items = [];
    this.value = "";
    this.defaultValue = "";
    this.multiple = false;
    this.collapsible = false;
    this.disabled = false;
  }
  /**
   * Parse the comma-separated value string into a Set.
   * Private to avoid api-extractor issues with Set in public API.
   */
  getExpandedSet() {
    return new Set(
      this.value.split(",").map((v3) => v3.trim()).filter((v3) => v3 !== "")
    );
  }
  connectedCallback() {
    super.connectedCallback();
    if (this.defaultValue && !this.value) {
      this.value = this.defaultValue;
    }
  }
  /**
   * SSR slotchange workaround: after hydration, manually trigger
   * slotchange to discover children that were server-rendered.
   */
  firstUpdated() {
    if (!o5) {
      const slot = this.shadowRoot?.querySelector(
        "slot:not([name])"
      );
      if (slot) {
        slot.dispatchEvent(new Event("slotchange"));
      }
    }
  }
  /**
   * Sync child states when properties change.
   * Uses PropertyValues type (not Map) to avoid api-extractor DTS rollup crash.
   */
  updated(changedProperties) {
    if (changedProperties.has("value")) {
      this.syncChildStates();
      this.updateRovingTabindex();
    }
    if (changedProperties.has("disabled")) {
      this.syncDisabledState();
      this.updateRovingTabindex();
    }
  }
  /**
   * Discover child accordion items from slotchange event.
   * Filters for LUI-ACCORDION-ITEM elements and syncs state.
   */
  handleSlotChange(e7) {
    const slot = e7.target;
    const assigned = slot.assignedElements({ flatten: true });
    this.items = assigned.filter(
      (el) => el.tagName === "LUI-ACCORDION-ITEM"
    );
    this.syncChildStates();
    this.syncDisabledState();
    this.updateRovingTabindex();
  }
  /**
   * Handle keyboard navigation on the accordion container.
   * ArrowDown/ArrowUp move focus between enabled items with wrapping.
   * Home/End jump to first/last enabled item.
   * Enter/Space are NOT handled here — they trigger the button's native click.
   */
  handleKeyDown(e7) {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e7.key)) return;
    e7.preventDefault();
    const enabledItems = this.items.filter((i8) => !i8.disabled);
    if (enabledItems.length === 0) return;
    const currentIndex = enabledItems.findIndex((i8) => i8.tabIndex === 0);
    const idx = currentIndex === -1 ? 0 : currentIndex;
    let nextIndex;
    switch (e7.key) {
      case "ArrowDown":
        nextIndex = (idx + 1) % enabledItems.length;
        break;
      case "ArrowUp":
        nextIndex = (idx - 1 + enabledItems.length) % enabledItems.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = enabledItems.length - 1;
        break;
      default:
        return;
    }
    for (const item of this.items) {
      item.tabIndex = -1;
    }
    enabledItems[nextIndex].tabIndex = 0;
    enabledItems[nextIndex].focusHeader();
  }
  /**
   * Update roving tabindex so exactly one enabled item has tabindex=0.
   * Priority: first expanded enabled item, otherwise first enabled item.
   */
  updateRovingTabindex() {
    const enabledItems = this.items.filter((i8) => !i8.disabled);
    if (enabledItems.length === 0) return;
    const expanded = this.getExpandedSet();
    const focusTarget = enabledItems.find((i8) => expanded.has(i8.value)) ?? enabledItems[0];
    for (const item of this.items) {
      item.tabIndex = -1;
    }
    focusTarget.tabIndex = 0;
  }
  /**
   * Handle internal ui-accordion-toggle events from child items.
   * Manages single-expand, multi-expand, and collapsible logic.
   * Dispatches consumer-facing ui-change event.
   */
  handleItemToggle(e7) {
    e7.stopPropagation();
    const itemValue = e7.detail.value;
    const expanded = this.getExpandedSet();
    if (this.multiple) {
      const updated = new Set(expanded);
      if (updated.has(itemValue)) {
        updated.delete(itemValue);
      } else {
        updated.add(itemValue);
      }
      this.value = [...updated].join(",");
    } else {
      if (expanded.has(itemValue)) {
        if (this.collapsible) {
          this.value = "";
        } else {
          return;
        }
      } else {
        this.value = itemValue;
      }
    }
    this.syncChildStates();
    dispatchCustomEvent(this, "ui-change", {
      value: this.value,
      expandedItems: [...this.getExpandedSet()]
    });
  }
  /**
   * Sync expanded state to all child items based on current value.
   */
  syncChildStates() {
    const expanded = this.getExpandedSet();
    for (const item of this.items) {
      item.expanded = expanded.has(item.value);
    }
  }
  /**
   * Propagate disabled state to all child items.
   */
  syncDisabledState() {
    if (this.disabled) {
      for (const item of this.items) {
        item.disabled = true;
      }
    }
  }
  static {
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: block;
      }

      :host([disabled]) {
        opacity: 0.5;
      }

      .accordion-wrapper {
        border: var(--ui-accordion-border-width) solid var(--ui-accordion-border);
        border-radius: var(--ui-accordion-radius);
        overflow: hidden;
      }
    `
    ];
  }
  render() {
    return b2`
      <div
        class="accordion-wrapper"
        @ui-accordion-toggle=${this.handleItemToggle}
        @keydown=${this.handleKeyDown}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }
};
__decorateClass([
  n4({ type: String })
], Accordion.prototype, "value", 2);
__decorateClass([
  n4({ type: String, attribute: "default-value" })
], Accordion.prototype, "defaultValue", 2);
__decorateClass([
  n4({ type: Boolean })
], Accordion.prototype, "multiple", 2);
__decorateClass([
  n4({ type: Boolean })
], Accordion.prototype, "collapsible", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Accordion.prototype, "disabled", 2);
if (!customElements.get("lui-accordion")) {
  customElements.define("lui-accordion", Accordion);
}

// src/components/ui/accordion-item.ts
var AccordionItem = class extends TailwindElement {
  constructor() {
    super(...arguments);
    /**
     * Unique ID for ARIA label/control associations within shadow DOM.
     */
    this.itemId = `lui-ai-${Math.random().toString(36).substr(2, 9)}`;
    this.value = "";
    this.expanded = false;
    this.disabled = false;
    this.headingLevel = 3;
    this.lazy = false;
    /**
     * Tracks whether this item has ever been expanded (for lazy mounting).
     * Plain class field -- NOT reactive, since `expanded` changes already trigger re-render.
     */
    this._hasBeenExpanded = false;
  }
  static {
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: block;
        border-bottom: var(--ui-accordion-border-width) solid
          var(--ui-accordion-border);
      }

      :host(:last-of-type) {
        border-bottom: none;
      }

      :host([disabled]) .header-button {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .header-button {
        display: flex;
        align-items: center;
        width: 100%;
        border: none;
        background: var(--ui-accordion-header-bg, transparent);
        color: var(--ui-accordion-header-text, inherit);
        font-weight: var(--ui-accordion-header-font-weight, 500);
        font-size: var(--ui-accordion-header-font-size, inherit);
        padding: var(--ui-accordion-header-padding, 0.75rem 0);
        cursor: pointer;
        text-align: left;
        font-family: inherit;
      }

      .header-button:hover {
        background: var(--ui-accordion-header-hover-bg, transparent);
      }

      .header-button:focus-visible {
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-accordion-ring, currentColor));
        outline-offset: 2px;
      }

      .panel-wrapper {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows var(--ui-accordion-transition, 200ms) ease;
      }

      :host([expanded]) .panel-wrapper {
        grid-template-rows: 1fr;
      }

      .panel-content {
        min-height: 0;
        overflow: clip;
      }

      .panel-inner {
        padding: var(--ui-accordion-panel-padding, 0 0 0.75rem 0);
        color: var(--ui-accordion-panel-text, inherit);
      }

      .chevron {
        flex-shrink: 0;
        width: 1em;
        height: 1em;
        margin-left: auto;
        transition: transform var(--ui-accordion-transition, 200ms) ease;
      }

      :host([expanded]) .chevron {
        transform: rotate(180deg);
      }

      @media (prefers-reduced-motion: reduce) {
        .panel-wrapper {
          transition-duration: 0ms;
        }

        .chevron {
          transition-duration: 0ms;
        }
      }
    `
    ];
  }
  connectedCallback() {
    super.connectedCallback();
    if (!o5) {
      this.setAttribute("data-state", this.expanded ? "open" : "closed");
    }
  }
  updated(changedProperties) {
    if (changedProperties.has("expanded")) {
      if (!o5) {
        this.setAttribute("data-state", this.expanded ? "open" : "closed");
      }
      if (this.expanded) {
        this._hasBeenExpanded = true;
      }
    }
  }
  /**
   * Focus the header button programmatically.
   * Used by parent accordion for roving tabindex keyboard navigation.
   */
  focusHeader() {
    const btn = this.shadowRoot?.querySelector(
      ".header-button"
    );
    btn?.focus();
  }
  /**
   * Handle click on the header button.
   * Dispatches ui-accordion-toggle internal event for parent to handle.
   * Does NOT self-toggle expanded state.
   */
  handleToggle() {
    if (this.disabled) return;
    dispatchCustomEvent(this, "ui-accordion-toggle", { value: this.value });
  }
  render() {
    return b2`
      <div role="heading" aria-level="${this.headingLevel}">
        <button
          id="${this.itemId}-header"
          class="header-button"
          aria-expanded="${this.expanded ? "true" : "false"}"
          aria-controls="${this.itemId}-panel"
          aria-disabled="${this.disabled ? "true" : A}"
          tabindex="-1"
          @click=${this.handleToggle}
        >
          <slot name="header"></slot>
          <svg
            class="chevron"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
            part="chevron"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      <div class="panel-wrapper">
        <div class="panel-content">
          <div
            class="panel-inner"
            role="region"
            aria-labelledby="${this.itemId}-header"
            id="${this.itemId}-panel"
          >
            ${this.lazy && !this._hasBeenExpanded && !this.expanded ? A : b2`<slot></slot>`}
          </div>
        </div>
      </div>
    `;
  }
};
__decorateClass([
  n4({ type: String })
], AccordionItem.prototype, "value", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AccordionItem.prototype, "expanded", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AccordionItem.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Number, attribute: "heading-level" })
], AccordionItem.prototype, "headingLevel", 2);
__decorateClass([
  n4({ type: Boolean })
], AccordionItem.prototype, "lazy", 2);
if (!customElements.get("lui-accordion-item")) {
  customElements.define("lui-accordion-item", AccordionItem);
}

// node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/directive.js
var t4 = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 };
var e6 = (t6) => (...e7) => ({ _$litDirective$: t6, values: e7 });
var i5 = class {
  constructor(t6) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t6, e7, i8) {
    this._$Ct = t6, this._$AM = e7, this._$Ci = i8;
  }
  _$AS(t6, e7) {
    return this.update(t6, e7);
  }
  update(t6, e7) {
    return this.render(...e7);
  }
};

// node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/directives/style-map.js
var n5 = "important";
var i6 = " !" + n5;
var o7 = e6(class extends i5 {
  constructor(t6) {
    if (super(t6), t6.type !== t4.ATTRIBUTE || "style" !== t6.name || t6.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
  }
  render(t6) {
    return Object.keys(t6).reduce((e7, r6) => {
      const s5 = t6[r6];
      return null == s5 ? e7 : e7 + `${r6 = r6.includes("-") ? r6 : r6.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${s5};`;
    }, "");
  }
  update(e7, [r6]) {
    const { style: s5 } = e7.element;
    if (void 0 === this.ft) return this.ft = new Set(Object.keys(r6)), this.render(r6);
    for (const t6 of this.ft) null == r6[t6] && (this.ft.delete(t6), t6.includes("-") ? s5.removeProperty(t6) : s5[t6] = null);
    for (const t6 in r6) {
      const e8 = r6[t6];
      if (null != e8) {
        this.ft.add(t6);
        const r7 = "string" == typeof e8 && e8.endsWith(i6);
        t6.includes("-") || r7 ? s5.setProperty(t6, r7 ? e8.slice(0, -11) : e8, r7 ? n5 : "") : s5[t6] = e8;
      }
    }
    return E;
  }
});

// src/components/ui/tabs.ts
var Tabs = class extends TailwindElement {
  constructor() {
    super(...arguments);
    /**
     * Discovered child tab panel elements.
     */
    this.panels = [];
    /**
     * Unique ID prefix for ARIA associations between tabs and panels.
     */
    this.tabsId = `lui-tabs-${Math.random().toString(36).substr(2, 9)}`;
    /**
     * Tracks which tab currently has focus (distinct from active tab in manual mode).
     */
    this._focusedValue = "";
    /**
     * Computed indicator position/size for the active tab.
     */
    this._indicatorStyle = {};
    /**
     * Prevents flash of unstyled indicator on first render.
     */
    this._indicatorReady = false;
    /**
     * Tracks container resize to reposition indicator.
     */
    this.resizeObserver = null;
    this._showScrollLeft = false;
    this._showScrollRight = false;
    this.value = "";
    this.defaultValue = "";
    this.disabled = false;
    this.label = "";
    this.orientation = "horizontal";
    this.activationMode = "automatic";
  }
  connectedCallback() {
    super.connectedCallback();
    if (this.defaultValue && !this.value) {
      this.value = this.defaultValue;
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }
  /**
   * SSR slotchange workaround: after hydration, manually trigger
   * slotchange to discover children that were server-rendered.
   * Also sets up ResizeObserver for indicator repositioning.
   */
  firstUpdated() {
    if (!o5) {
      const slot = this.shadowRoot?.querySelector(
        "slot:not([name])"
      );
      if (slot) {
        slot.dispatchEvent(new Event("slotchange"));
      }
      const tablist = this.shadowRoot?.querySelector(
        ".tablist"
      );
      if (tablist) {
        this.resizeObserver = new ResizeObserver(() => {
          this.updateIndicator();
          this.updateScrollButtons();
        });
        this.resizeObserver.observe(tablist);
      }
      this.updateComplete.then(() => {
        this.updateIndicator();
        this.updateScrollButtons();
      });
    }
  }
  /**
   * Compute indicator position/size from the active tab button.
   */
  updateIndicator() {
    if (o5) return;
    const button = this.shadowRoot?.querySelector(
      `#${this.tabsId}-tab-${this.value}`
    );
    const tablist = this.shadowRoot?.querySelector(
      ".tablist"
    );
    if (!button || !tablist) {
      this._indicatorReady = false;
      this.requestUpdate();
      return;
    }
    const buttonRect = button.getBoundingClientRect();
    const tablistRect = tablist.getBoundingClientRect();
    if (this.orientation === "vertical") {
      this._indicatorStyle = {
        transform: `translateY(${buttonRect.top - tablistRect.top + tablist.scrollTop}px)`,
        height: `${buttonRect.height}px`
      };
    } else {
      this._indicatorStyle = {
        transform: `translateX(${buttonRect.left - tablistRect.left + tablist.scrollLeft}px)`,
        width: `${buttonRect.width}px`
      };
    }
    this._indicatorReady = true;
    this.requestUpdate();
  }
  /**
   * Check if the tablist overflows and update scroll button visibility.
   */
  updateScrollButtons() {
    if (o5) return;
    if (this.orientation === "vertical") {
      this._showScrollLeft = false;
      this._showScrollRight = false;
      return;
    }
    const tablist = this.shadowRoot?.querySelector(
      ".tablist"
    );
    if (!tablist) return;
    this._showScrollLeft = tablist.scrollLeft > 1;
    this._showScrollRight = tablist.scrollLeft + tablist.clientWidth < tablist.scrollWidth - 1;
  }
  /**
   * Scroll the tablist in the given direction.
   */
  scrollTabs(direction) {
    const tablist = this.shadowRoot?.querySelector(
      ".tablist"
    );
    if (!tablist) return;
    const scrollAmount = tablist.clientWidth * 0.75;
    tablist.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  }
  /**
   * Sync panel states when value changes.
   * In automatic mode, keep _focusedValue in sync with active value.
   */
  updated(changedProperties) {
    if (changedProperties.has("value")) {
      this.syncPanelStates();
      if (this.activationMode === "automatic") {
        this._focusedValue = this.value;
      }
      this.updateComplete.then(() => this.updateIndicator());
    }
  }
  /**
   * Discover child tab panels from slotchange event.
   * Filters for LUI-TAB-PANEL elements, syncs state, and auto-selects
   * the first non-disabled panel if no value is set.
   */
  handleSlotChange(e7) {
    const slot = e7.target;
    const assigned = slot.assignedElements({ flatten: true });
    this.panels = assigned.filter(
      (el) => el.tagName === "LUI-TAB-PANEL"
    );
    if (!this.value && this.panels.length > 0) {
      const firstEnabled = this.panels.find((p4) => !p4.disabled);
      if (firstEnabled) {
        this.value = firstEnabled.value;
      }
    }
    this._focusedValue = this.value;
    this.syncPanelStates();
    this.requestUpdate();
    this.updateComplete.then(() => {
      this.updateIndicator();
      this.updateScrollButtons();
    });
  }
  /**
   * Handle click on a tab button.
   * Sets the active tab, syncs panel states, and dispatches ui-change event.
   */
  handleTabClick(panelValue, panelDisabled) {
    if (this.disabled || panelDisabled) return;
    this.value = panelValue;
    this._focusedValue = panelValue;
    this.syncPanelStates();
    dispatchCustomEvent(this, "ui-change", { value: this.value });
  }
  /**
   * Handle keyboard navigation on the tablist.
   * Orientation-aware arrow keys, Home, End, and Enter/Space (manual mode).
   */
  handleKeyDown(e7) {
    const forwardKey = this.orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    const backwardKey = this.orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
    const handledKeys = [forwardKey, backwardKey, "Home", "End"];
    if (this.activationMode === "manual") {
      handledKeys.push("Enter", " ");
    }
    if (!handledKeys.includes(e7.key)) return;
    e7.preventDefault();
    if (this.activationMode === "manual" && (e7.key === "Enter" || e7.key === " ")) {
      if (this._focusedValue && this._focusedValue !== this.value) {
        const panel = this.panels.find(
          (p4) => p4.value === this._focusedValue && !p4.disabled
        );
        if (panel) {
          this.value = this._focusedValue;
          this.syncPanelStates();
          dispatchCustomEvent(this, "ui-change", { value: this.value });
        }
      }
      return;
    }
    const enabledPanels = this.panels.filter((p4) => !p4.disabled);
    if (enabledPanels.length === 0) return;
    const currentFocused = this._focusedValue || this.value;
    const currentIndex = enabledPanels.findIndex(
      (p4) => p4.value === currentFocused
    );
    let nextIndex;
    switch (e7.key) {
      case forwardKey:
        nextIndex = (currentIndex + 1) % enabledPanels.length;
        break;
      case backwardKey:
        nextIndex = (currentIndex - 1 + enabledPanels.length) % enabledPanels.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = enabledPanels.length - 1;
        break;
      default:
        return;
    }
    const nextPanel = enabledPanels[nextIndex];
    if (this.activationMode === "automatic") {
      this.value = nextPanel.value;
      this._focusedValue = nextPanel.value;
      this.syncPanelStates();
      dispatchCustomEvent(this, "ui-change", { value: this.value });
      this.focusTabButton(nextPanel.value);
    } else {
      this._focusedValue = nextPanel.value;
      this.requestUpdate();
      this.updateComplete.then(() => {
        this.focusTabButton(nextPanel.value);
      });
    }
  }
  /**
   * Focus a tab button in the shadow DOM by its panel value.
   */
  focusTabButton(panelValue) {
    const button = this.shadowRoot?.querySelector(
      `#${this.tabsId}-tab-${panelValue}`
    );
    button?.focus();
  }
  /**
   * Get the tabindex for a tab button based on activation mode.
   * In automatic mode: active tab gets 0, others -1.
   * In manual mode: focused tab gets 0, others -1.
   */
  getTabIndex(panel) {
    const focusTarget = this._focusedValue || this.value;
    return panel.value === focusTarget ? "0" : "-1";
  }
  /**
   * Check if a panel contains focusable content (links, buttons, inputs, etc.).
   * Used to determine whether active panels need tabindex="0" for keyboard access.
   */
  panelHasFocusableContent(panel) {
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return panel.querySelector(focusableSelector) !== null;
  }
  /**
   * Sync active state and ARIA attributes on all child panels.
   * Sets active, id, aria-labelledby, role, and conditional tabindex on each panel host element.
   * Active panels get tabindex="0" only when they have no focusable children (W3C APG).
   */
  syncPanelStates() {
    for (const panel of this.panels) {
      const isActive = panel.value === this.value;
      panel.active = isActive;
      panel.id = `${this.tabsId}-panel-${panel.value}`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute(
        "aria-labelledby",
        `${this.tabsId}-tab-${panel.value}`
      );
      if (isActive) {
        if (this.panelHasFocusableContent(panel)) {
          panel.removeAttribute("tabindex");
        } else {
          panel.setAttribute("tabindex", "0");
        }
      } else {
        panel.removeAttribute("tabindex");
      }
    }
    const activePanel = this.panels.find((p4) => p4.value === this.value);
    if (activePanel?.lazy && !o5) {
      requestAnimationFrame(() => {
        if (this.panelHasFocusableContent(activePanel)) {
          activePanel.removeAttribute("tabindex");
        } else {
          activePanel.setAttribute("tabindex", "0");
        }
      });
    }
  }
  static {
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: block;
      }

      :host([disabled]) {
        opacity: 0.5;
        pointer-events: none;
      }

      .tablist-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .tablist {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--ui-tabs-list-gap);
        padding: var(--ui-tabs-list-padding);
        background: var(--ui-tabs-list-bg);
        border-radius: var(--ui-tabs-list-radius);
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .tablist::-webkit-scrollbar {
        display: none;
      }

      :host([orientation='vertical']) .tablist-wrapper {
        display: contents;
      }

      :host([orientation='vertical']) .tablist {
        flex-direction: column;
        align-items: stretch;
      }

      :host([orientation='vertical']) .tabs-wrapper {
        display: flex;
        gap: 1rem;
      }

      .tab-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        border: none;
        background: var(--ui-tabs-tab-bg);
        color: var(--ui-tabs-tab-text);
        font-family: inherit;
        font-size: var(--ui-tabs-tab-font-size);
        font-weight: var(--ui-tabs-tab-font-weight);
        padding: var(--ui-tabs-tab-padding);
        border-radius: var(--ui-tabs-tab-radius);
        cursor: pointer;
        transition:
          color var(--ui-tabs-transition),
          background var(--ui-tabs-transition),
          box-shadow var(--ui-tabs-transition);
      }

      .tab-button:hover:not([aria-disabled='true']) {
        color: var(--ui-tabs-tab-hover-text);
        background: var(--ui-tabs-tab-hover-bg);
      }

      .tab-button.tab-active {
        color: var(--ui-tabs-tab-active-text);
        background: var(--ui-tabs-tab-active-bg);
        box-shadow: var(--ui-tabs-tab-active-shadow);
      }

      .tab-button[aria-disabled='true'] {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .tab-button:focus-visible {
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-tabs-ring));
        outline-offset: 2px;
      }

      .tab-button.tab-active:focus-visible {
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-tabs-ring));
        outline-offset: 2px;
      }

      .scroll-button {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--ui-tabs-scroll-button-size, 2rem);
        height: var(--ui-tabs-scroll-button-size, 2rem);
        border: none;
        background: var(--ui-tabs-list-bg);
        color: var(--ui-tabs-tab-text);
        cursor: pointer;
        border-radius: var(--ui-tabs-tab-radius);
        transition: color var(--ui-tabs-transition), background var(--ui-tabs-transition);
      }

      .scroll-button:hover {
        color: var(--ui-tabs-tab-hover-text);
        background: var(--ui-tabs-tab-hover-bg);
      }

      .panels-container {
        padding: var(--ui-tabs-panel-padding);
        color: var(--ui-tabs-panel-text);
      }

      .tab-indicator {
        position: absolute;
        bottom: 0;
        left: 0;
        height: var(--ui-tabs-indicator-height, 2px);
        background: var(--ui-tabs-indicator-color, var(--color-primary, var(--ui-color-primary)));
        border-radius: var(--ui-tabs-indicator-radius, 9999px);
        transition:
          transform var(--ui-tabs-indicator-transition, 200ms) ease,
          width var(--ui-tabs-indicator-transition, 200ms) ease,
          height var(--ui-tabs-indicator-transition, 200ms) ease,
          opacity 150ms ease;
        pointer-events: none;
      }

      :host([orientation="vertical"]) .tab-indicator {
        bottom: auto;
        top: 0;
        width: var(--ui-tabs-indicator-height, 2px) !important;
      }

      @media (prefers-reduced-motion: reduce) {
        .tab-button {
          transition-duration: 0ms;
        }
        .tab-indicator {
          transition-duration: 0ms;
        }
      }
    `
    ];
  }
  render() {
    return b2`
      <div
        class="tabs-wrapper"
        @ui-tab-panel-update=${() => this.requestUpdate()}
      >
        <div class="tablist-wrapper">
          ${this._showScrollLeft ? b2`
            <button
              class="scroll-button scroll-left"
              aria-hidden="true"
              tabindex="-1"
              @click=${() => this.scrollTabs("left")}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true" width="16" height="16">
                <path d="M10 4l-4 4 4 4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          ` : A}

          <div
            class="tablist"
            role="tablist"
            aria-orientation="${this.orientation}"
            aria-label="${this.label || A}"
            @keydown=${this.handleKeyDown}
            @scroll=${this.updateScrollButtons}
          >
            ${this.panels.map(
      (panel) => b2`
                <button
                  id="${this.tabsId}-tab-${panel.value}"
                  role="tab"
                  aria-selected="${panel.value === this.value ? "true" : "false"}"
                  aria-controls="${this.tabsId}-panel-${panel.value}"
                  aria-disabled="${panel.disabled ? "true" : A}"
                  data-state="${panel.value === this.value ? "active" : "inactive"}"
                  tabindex="${this.getTabIndex(panel)}"
                  class="tab-button ${panel.value === this.value ? "tab-active" : ""}"
                  @click=${() => this.handleTabClick(panel.value, panel.disabled)}
                >
                  ${panel.label}
                </button>
              `
    )}
            <div
              class="tab-indicator"
              style=${o7({
      ...this._indicatorStyle,
      opacity: this._indicatorReady ? "1" : "0"
    })}
            ></div>
          </div>

          ${this._showScrollRight ? b2`
            <button
              class="scroll-button scroll-right"
              aria-hidden="true"
              tabindex="-1"
              @click=${() => this.scrollTabs("right")}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true" width="16" height="16">
                <path d="M6 4l4 4-4 4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          ` : A}
        </div>
        <div class="panels-container">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
      </div>
    `;
  }
};
__decorateClass([
  r5()
], Tabs.prototype, "_showScrollLeft", 2);
__decorateClass([
  r5()
], Tabs.prototype, "_showScrollRight", 2);
__decorateClass([
  n4({ type: String })
], Tabs.prototype, "value", 2);
__decorateClass([
  n4({ type: String, attribute: "default-value" })
], Tabs.prototype, "defaultValue", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Tabs.prototype, "disabled", 2);
__decorateClass([
  n4({ type: String })
], Tabs.prototype, "label", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], Tabs.prototype, "orientation", 2);
__decorateClass([
  n4({ type: String, attribute: "activation-mode" })
], Tabs.prototype, "activationMode", 2);
if (!customElements.get("lui-tabs")) {
  customElements.define("lui-tabs", Tabs);
}

// src/components/ui/tab-panel.ts
var TabPanel = class extends TailwindElement {
  constructor() {
    super(...arguments);
    this.value = "";
    this.label = "";
    this.disabled = false;
    this.active = false;
    this.lazy = false;
    /**
     * Tracks whether this lazy panel has been activated at least once.
     */
    this._hasBeenExpanded = false;
  }
  updated(changedProperties) {
    if (changedProperties.has("label") || changedProperties.has("disabled")) {
      dispatchCustomEvent(this, "ui-tab-panel-update", {});
    }
    if (changedProperties.has("active") && !o5) {
      this.setAttribute("data-state", this.active ? "active" : "inactive");
    }
    if (changedProperties.has("active") && this.active) {
      this._hasBeenExpanded = true;
    }
  }
  static {
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: block;
      }

      :host(:not([active])) {
        display: none;
      }
    `
    ];
  }
  render() {
    if (this.lazy && !this._hasBeenExpanded && !this.active) {
      return A;
    }
    return b2`<slot></slot>`;
  }
};
__decorateClass([
  n4({ type: String })
], TabPanel.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], TabPanel.prototype, "label", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], TabPanel.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], TabPanel.prototype, "active", 2);
__decorateClass([
  n4({ type: Boolean })
], TabPanel.prototype, "lazy", 2);
if (!customElements.get("lui-tab-panel")) {
  customElements.define("lui-tab-panel", TabPanel);
}

// src/components/ui/dialog.ts
var Dialog = class extends TailwindElement {
  constructor() {
    super(...arguments);
    this.open = false;
    this.size = "md";
    this.dismissible = true;
    this.showCloseButton = false;
    /**
     * The element that had focus before the dialog opened.
     * Focus is restored to this element on close.
     */
    this.triggerElement = null;
  }
  /**
   * Called when reactive properties change.
   * Syncs the open property with the native dialog state.
   */
  updated(changedProperties) {
    if (changedProperties.has("open")) {
      if (this.open && !this.dialogEl.open) {
        this.dialogEl.showModal();
      } else if (!this.open && this.dialogEl.open) {
        this.dialogEl.close();
      }
    }
  }
  /**
   * Opens the dialog.
   * Stores the currently focused element for focus restoration on close.
   */
  show() {
    this.triggerElement = document.activeElement;
    this.open = true;
  }
  /**
   * Closes the dialog.
   * Emits a close event with the specified reason.
   * @param reason - The reason for closing (default: 'programmatic')
   */
  close(reason = "programmatic") {
    this.emitClose(reason);
  }
  /**
   * Emits the close event and updates the open state.
   * @param reason - The reason for closing
   */
  emitClose(reason) {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("close", {
        detail: { reason },
        bubbles: true,
        composed: true
      })
    );
  }
  /**
   * Handles the native cancel event (triggered by Escape key).
   * Prevents default if the dialog is not dismissible.
   */
  handleCancel(e7) {
    if (!this.dismissible) {
      e7.preventDefault();
      return;
    }
    this.emitClose("escape");
  }
  /**
   * Handles the native close event.
   * Restores focus to the element that opened the dialog.
   */
  handleNativeClose() {
    if (this.triggerElement && typeof this.triggerElement.focus === "function") {
      this.triggerElement.focus();
    }
    this.triggerElement = null;
  }
  /**
   * Handles clicks on the dialog element.
   * Closes if clicking the backdrop area (not the content) and dismissible.
   */
  handleDialogClick(e7) {
    if (e7.target === this.dialogEl && this.dismissible) {
      this.emitClose("backdrop");
    }
  }
  /**
   * Gets the size class for the dialog content.
   */
  getSizeClasses() {
    const sizeClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg"
    };
    return sizeClasses[this.size];
  }
  render() {
    return b2`
      <dialog
        @cancel=${this.handleCancel}
        @close=${this.handleNativeClose}
        @click=${this.handleDialogClick}
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div
          class="dialog-content ${this.getSizeClasses()} bg-card text-card-foreground rounded-lg shadow-lg p-6 relative"
          @click=${(e7) => e7.stopPropagation()}
        >
          ${this.showCloseButton ? b2`
                <button
                  class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  @click=${() => this.close("programmatic")}
                  aria-label="Close dialog"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              ` : A}
          <header id="dialog-title" class="text-lg font-semibold mb-4">
            <slot name="title"></slot>
          </header>
          <div id="dialog-description" class="text-muted-foreground">
            <slot></slot>
          </div>
          <footer class="mt-6 flex justify-end gap-3">
            <slot name="footer"></slot>
          </footer>
        </div>
      </dialog>
    `;
  }
};
/**
 * Static styles for dialog animations and layout.
 * Uses native CSS transitions with @starting-style for enter animations
 * and transition-behavior: allow-discrete for exit animations.
 */
Dialog.styles = i`
    :host {
      display: contents;
    }

    dialog {
      border: none;
      padding: 0;
      background: transparent;
      max-height: 85vh;
      max-width: 90vw;
      margin: auto;

      /* Animation styles */
      opacity: 0;
      transform: scale(0.95);
      transition:
        opacity 150ms ease-out,
        transform 150ms ease-out,
        display 150ms allow-discrete,
        overlay 150ms allow-discrete;
    }

    dialog[open] {
      opacity: 1;
      transform: scale(1);
    }

    @starting-style {
      dialog[open] {
        opacity: 0;
        transform: scale(0.95);
      }
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition:
        opacity 150ms ease-out,
        display 150ms allow-discrete,
        overlay 150ms allow-discrete;
    }

    dialog[open]::backdrop {
      opacity: 1;
    }

    @starting-style {
      dialog[open]::backdrop {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      dialog,
      dialog::backdrop {
        transition: none;
      }
    }

    .dialog-content {
      width: 100%;
    }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Dialog.prototype, "open", 2);
__decorateClass([
  n4({ type: String })
], Dialog.prototype, "size", 2);
__decorateClass([
  n4({ type: Boolean })
], Dialog.prototype, "dismissible", 2);
__decorateClass([
  n4({ type: Boolean, attribute: "show-close-button" })
], Dialog.prototype, "showCloseButton", 2);
__decorateClass([
  e5("dialog")
], Dialog.prototype, "dialogEl", 2);
Dialog = __decorateClass([
  t3("ui-dialog")
], Dialog);

// node_modules/.pnpm/@floating-ui+utils@0.2.11/node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var min = Math.min;
var max = Math.max;
var round = Math.round;
var floor = Math.floor;
var createCoords = (v3) => ({
  x: v3,
  y: v3
});
var oppositeSideMap = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
function clamp(start, value, end) {
  return max(start, min(value, end));
}
function evaluate(value, param) {
  return typeof value === "function" ? value(param) : value;
}
function getSide(placement) {
  return placement.split("-")[0];
}
function getAlignment(placement) {
  return placement.split("-")[1];
}
function getOppositeAxis(axis) {
  return axis === "x" ? "y" : "x";
}
function getAxisLength(axis) {
  return axis === "y" ? "height" : "width";
}
function getSideAxis(placement) {
  const firstChar = placement[0];
  return firstChar === "t" || firstChar === "b" ? "y" : "x";
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
  if (rtl === void 0) {
    rtl = false;
  }
  const alignment = getAlignment(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const length = getAxisLength(alignmentAxis);
  let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
  if (rects.reference[length] > rects.floating[length]) {
    mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
  }
  return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
  const oppositePlacement = getOppositePlacement(placement);
  return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
}
function getOppositeAlignmentPlacement(placement) {
  return placement.includes("start") ? placement.replace("start", "end") : placement.replace("end", "start");
}
var lrPlacement = ["left", "right"];
var rlPlacement = ["right", "left"];
var tbPlacement = ["top", "bottom"];
var btPlacement = ["bottom", "top"];
function getSideList(side, isStart, rtl) {
  switch (side) {
    case "top":
    case "bottom":
      if (rtl) return isStart ? rlPlacement : lrPlacement;
      return isStart ? lrPlacement : rlPlacement;
    case "left":
    case "right":
      return isStart ? tbPlacement : btPlacement;
    default:
      return [];
  }
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
  const alignment = getAlignment(placement);
  let list = getSideList(getSide(placement), direction === "start", rtl);
  if (alignment) {
    list = list.map((side) => side + "-" + alignment);
    if (flipAlignment) {
      list = list.concat(list.map(getOppositeAlignmentPlacement));
    }
  }
  return list;
}
function getOppositePlacement(placement) {
  const side = getSide(placement);
  return oppositeSideMap[side] + placement.slice(side.length);
}
function expandPaddingObject(padding) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...padding
  };
}
function getPaddingObject(padding) {
  return typeof padding !== "number" ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
function rectToClientRect(rect) {
  const {
    x: x2,
    y: y3,
    width,
    height
  } = rect;
  return {
    width,
    height,
    top: y3,
    left: x2,
    right: x2 + width,
    bottom: y3 + height,
    x: x2,
    y: y3
  };
}

// node_modules/.pnpm/@floating-ui+core@1.7.5/node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function computeCoordsFromPlacement(_ref, placement, rtl) {
  let {
    reference,
    floating
  } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === "y";
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case "top":
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case "bottom":
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case "right":
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case "left":
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  switch (getAlignment(placement)) {
    case "start":
      coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
      break;
    case "end":
      coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
      break;
  }
  return coords;
}
async function detectOverflow(state, options) {
  var _await$platform$isEle;
  if (options === void 0) {
    options = {};
  }
  const {
    x: x2,
    y: y3,
    platform: platform2,
    rects,
    elements,
    strategy
  } = state;
  const {
    boundary = "clippingAncestors",
    rootBoundary = "viewport",
    elementContext = "floating",
    altBoundary = false,
    padding = 0
  } = evaluate(options, state);
  const paddingObject = getPaddingObject(padding);
  const altContext = elementContext === "floating" ? "reference" : "floating";
  const element = elements[altBoundary ? altContext : elementContext];
  const clippingClientRect = rectToClientRect(await platform2.getClippingRect({
    element: ((_await$platform$isEle = await (platform2.isElement == null ? void 0 : platform2.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform2.getDocumentElement == null ? void 0 : platform2.getDocumentElement(elements.floating)),
    boundary,
    rootBoundary,
    strategy
  }));
  const rect = elementContext === "floating" ? {
    x: x2,
    y: y3,
    width: rects.floating.width,
    height: rects.floating.height
  } : rects.reference;
  const offsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(elements.floating));
  const offsetScale = await (platform2.isElement == null ? void 0 : platform2.isElement(offsetParent)) ? await (platform2.getScale == null ? void 0 : platform2.getScale(offsetParent)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  };
  const elementClientRect = rectToClientRect(platform2.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements,
    rect,
    offsetParent,
    strategy
  }) : rect);
  return {
    top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
    bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
    left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
    right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
  };
}
var MAX_RESET_COUNT = 50;
var computePosition = async (reference, floating, config) => {
  const {
    placement = "bottom",
    strategy = "absolute",
    middleware = [],
    platform: platform2
  } = config;
  const platformWithDetectOverflow = platform2.detectOverflow ? platform2 : {
    ...platform2,
    detectOverflow
  };
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(floating));
  let rects = await platform2.getElementRects({
    reference,
    floating,
    strategy
  });
  let {
    x: x2,
    y: y3
  } = computeCoordsFromPlacement(rects, placement, rtl);
  let statefulPlacement = placement;
  let resetCount = 0;
  const middlewareData = {};
  for (let i8 = 0; i8 < middleware.length; i8++) {
    const currentMiddleware = middleware[i8];
    if (!currentMiddleware) {
      continue;
    }
    const {
      name,
      fn
    } = currentMiddleware;
    const {
      x: nextX,
      y: nextY,
      data,
      reset
    } = await fn({
      x: x2,
      y: y3,
      initialPlacement: placement,
      placement: statefulPlacement,
      strategy,
      middlewareData,
      rects,
      platform: platformWithDetectOverflow,
      elements: {
        reference,
        floating
      }
    });
    x2 = nextX != null ? nextX : x2;
    y3 = nextY != null ? nextY : y3;
    middlewareData[name] = {
      ...middlewareData[name],
      ...data
    };
    if (reset && resetCount < MAX_RESET_COUNT) {
      resetCount++;
      if (typeof reset === "object") {
        if (reset.placement) {
          statefulPlacement = reset.placement;
        }
        if (reset.rects) {
          rects = reset.rects === true ? await platform2.getElementRects({
            reference,
            floating,
            strategy
          }) : reset.rects;
        }
        ({
          x: x2,
          y: y3
        } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
      }
      i8 = -1;
    }
  }
  return {
    x: x2,
    y: y3,
    placement: statefulPlacement,
    strategy,
    middlewareData
  };
};
var arrow = (options) => ({
  name: "arrow",
  options,
  async fn(state) {
    const {
      x: x2,
      y: y3,
      placement,
      rects,
      platform: platform2,
      elements,
      middlewareData
    } = state;
    const {
      element,
      padding = 0
    } = evaluate(options, state) || {};
    if (element == null) {
      return {};
    }
    const paddingObject = getPaddingObject(padding);
    const coords = {
      x: x2,
      y: y3
    };
    const axis = getAlignmentAxis(placement);
    const length = getAxisLength(axis);
    const arrowDimensions = await platform2.getDimensions(element);
    const isYAxis = axis === "y";
    const minProp = isYAxis ? "top" : "left";
    const maxProp = isYAxis ? "bottom" : "right";
    const clientProp = isYAxis ? "clientHeight" : "clientWidth";
    const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
    const startDiff = coords[axis] - rects.reference[axis];
    const arrowOffsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(element));
    let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;
    if (!clientSize || !await (platform2.isElement == null ? void 0 : platform2.isElement(arrowOffsetParent))) {
      clientSize = elements.floating[clientProp] || rects.floating[length];
    }
    const centerToReference = endDiff / 2 - startDiff / 2;
    const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
    const minPadding = min(paddingObject[minProp], largestPossiblePadding);
    const maxPadding = min(paddingObject[maxProp], largestPossiblePadding);
    const min$1 = minPadding;
    const max2 = clientSize - arrowDimensions[length] - maxPadding;
    const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
    const offset4 = clamp(min$1, center, max2);
    const shouldAddOffset = !middlewareData.arrow && getAlignment(placement) != null && center !== offset4 && rects.reference[length] / 2 - (center < min$1 ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
    const alignmentOffset = shouldAddOffset ? center < min$1 ? center - min$1 : center - max2 : 0;
    return {
      [axis]: coords[axis] + alignmentOffset,
      data: {
        [axis]: offset4,
        centerOffset: center - offset4 - alignmentOffset,
        ...shouldAddOffset && {
          alignmentOffset
        }
      },
      reset: shouldAddOffset
    };
  }
});
var flip = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "flip",
    options,
    async fn(state) {
      var _middlewareData$arrow, _middlewareData$flip;
      const {
        placement,
        middlewareData,
        rects,
        initialPlacement,
        platform: platform2,
        elements
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = true,
        fallbackPlacements: specifiedFallbackPlacements,
        fallbackStrategy = "bestFit",
        fallbackAxisSideDirection = "none",
        flipAlignment = true,
        ...detectOverflowOptions
      } = evaluate(options, state);
      if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      const side = getSide(placement);
      const initialSideAxis = getSideAxis(initialPlacement);
      const isBasePlacement = getSide(initialPlacement) === initialPlacement;
      const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
      const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
      const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none";
      if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
        fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
      }
      const placements2 = [initialPlacement, ...fallbackPlacements];
      const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
      const overflows = [];
      let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
      if (checkMainAxis) {
        overflows.push(overflow[side]);
      }
      if (checkCrossAxis) {
        const sides2 = getAlignmentSides(placement, rects, rtl);
        overflows.push(overflow[sides2[0]], overflow[sides2[1]]);
      }
      overflowsData = [...overflowsData, {
        placement,
        overflows
      }];
      if (!overflows.every((side2) => side2 <= 0)) {
        var _middlewareData$flip2, _overflowsData$filter;
        const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
        const nextPlacement = placements2[nextIndex];
        if (nextPlacement) {
          const ignoreCrossAxisOverflow = checkCrossAxis === "alignment" ? initialSideAxis !== getSideAxis(nextPlacement) : false;
          if (!ignoreCrossAxisOverflow || // We leave the current main axis only if every placement on that axis
          // overflows the main axis.
          overflowsData.every((d3) => getSideAxis(d3.placement) === initialSideAxis ? d3.overflows[0] > 0 : true)) {
            return {
              data: {
                index: nextIndex,
                overflows: overflowsData
              },
              reset: {
                placement: nextPlacement
              }
            };
          }
        }
        let resetPlacement = (_overflowsData$filter = overflowsData.filter((d3) => d3.overflows[0] <= 0).sort((a3, b3) => a3.overflows[1] - b3.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
        if (!resetPlacement) {
          switch (fallbackStrategy) {
            case "bestFit": {
              var _overflowsData$filter2;
              const placement2 = (_overflowsData$filter2 = overflowsData.filter((d3) => {
                if (hasFallbackAxisSideDirection) {
                  const currentSideAxis = getSideAxis(d3.placement);
                  return currentSideAxis === initialSideAxis || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  currentSideAxis === "y";
                }
                return true;
              }).map((d3) => [d3.placement, d3.overflows.filter((overflow2) => overflow2 > 0).reduce((acc, overflow2) => acc + overflow2, 0)]).sort((a3, b3) => a3[1] - b3[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
              if (placement2) {
                resetPlacement = placement2;
              }
              break;
            }
            case "initialPlacement":
              resetPlacement = initialPlacement;
              break;
          }
        }
        if (placement !== resetPlacement) {
          return {
            reset: {
              placement: resetPlacement
            }
          };
        }
      }
      return {};
    }
  };
};
var originSides = /* @__PURE__ */ new Set(["left", "top"]);
async function convertValueToCoords(state, options) {
  const {
    placement,
    platform: platform2,
    elements
  } = state;
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const isVertical = getSideAxis(placement) === "y";
  const mainAxisMulti = originSides.has(side) ? -1 : 1;
  const crossAxisMulti = rtl && isVertical ? -1 : 1;
  const rawValue = evaluate(options, state);
  let {
    mainAxis,
    crossAxis,
    alignmentAxis
  } = typeof rawValue === "number" ? {
    mainAxis: rawValue,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: rawValue.mainAxis || 0,
    crossAxis: rawValue.crossAxis || 0,
    alignmentAxis: rawValue.alignmentAxis
  };
  if (alignment && typeof alignmentAxis === "number") {
    crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
  }
  return isVertical ? {
    x: crossAxis * crossAxisMulti,
    y: mainAxis * mainAxisMulti
  } : {
    x: mainAxis * mainAxisMulti,
    y: crossAxis * crossAxisMulti
  };
}
var offset = function(options) {
  if (options === void 0) {
    options = 0;
  }
  return {
    name: "offset",
    options,
    async fn(state) {
      var _middlewareData$offse, _middlewareData$arrow;
      const {
        x: x2,
        y: y3,
        placement,
        middlewareData
      } = state;
      const diffCoords = await convertValueToCoords(state, options);
      if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      return {
        x: x2 + diffCoords.x,
        y: y3 + diffCoords.y,
        data: {
          ...diffCoords,
          placement
        }
      };
    }
  };
};
var shift = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "shift",
    options,
    async fn(state) {
      const {
        x: x2,
        y: y3,
        placement,
        platform: platform2
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = false,
        limiter = {
          fn: (_ref) => {
            let {
              x: x3,
              y: y4
            } = _ref;
            return {
              x: x3,
              y: y4
            };
          }
        },
        ...detectOverflowOptions
      } = evaluate(options, state);
      const coords = {
        x: x2,
        y: y3
      };
      const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
      const crossAxis = getSideAxis(getSide(placement));
      const mainAxis = getOppositeAxis(crossAxis);
      let mainAxisCoord = coords[mainAxis];
      let crossAxisCoord = coords[crossAxis];
      if (checkMainAxis) {
        const minSide = mainAxis === "y" ? "top" : "left";
        const maxSide = mainAxis === "y" ? "bottom" : "right";
        const min2 = mainAxisCoord + overflow[minSide];
        const max2 = mainAxisCoord - overflow[maxSide];
        mainAxisCoord = clamp(min2, mainAxisCoord, max2);
      }
      if (checkCrossAxis) {
        const minSide = crossAxis === "y" ? "top" : "left";
        const maxSide = crossAxis === "y" ? "bottom" : "right";
        const min2 = crossAxisCoord + overflow[minSide];
        const max2 = crossAxisCoord - overflow[maxSide];
        crossAxisCoord = clamp(min2, crossAxisCoord, max2);
      }
      const limitedCoords = limiter.fn({
        ...state,
        [mainAxis]: mainAxisCoord,
        [crossAxis]: crossAxisCoord
      });
      return {
        ...limitedCoords,
        data: {
          x: limitedCoords.x - x2,
          y: limitedCoords.y - y3,
          enabled: {
            [mainAxis]: checkMainAxis,
            [crossAxis]: checkCrossAxis
          }
        }
      };
    }
  };
};
var size = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "size",
    options,
    async fn(state) {
      var _state$middlewareData, _state$middlewareData2;
      const {
        placement,
        rects,
        platform: platform2,
        elements
      } = state;
      const {
        apply = () => {
        },
        ...detectOverflowOptions
      } = evaluate(options, state);
      const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
      const side = getSide(placement);
      const alignment = getAlignment(placement);
      const isYAxis = getSideAxis(placement) === "y";
      const {
        width,
        height
      } = rects.floating;
      let heightSide;
      let widthSide;
      if (side === "top" || side === "bottom") {
        heightSide = side;
        widthSide = alignment === (await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating)) ? "start" : "end") ? "left" : "right";
      } else {
        widthSide = side;
        heightSide = alignment === "end" ? "top" : "bottom";
      }
      const maximumClippingHeight = height - overflow.top - overflow.bottom;
      const maximumClippingWidth = width - overflow.left - overflow.right;
      const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight);
      const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth);
      const noShift = !state.middlewareData.shift;
      let availableHeight = overflowAvailableHeight;
      let availableWidth = overflowAvailableWidth;
      if ((_state$middlewareData = state.middlewareData.shift) != null && _state$middlewareData.enabled.x) {
        availableWidth = maximumClippingWidth;
      }
      if ((_state$middlewareData2 = state.middlewareData.shift) != null && _state$middlewareData2.enabled.y) {
        availableHeight = maximumClippingHeight;
      }
      if (noShift && !alignment) {
        const xMin = max(overflow.left, 0);
        const xMax = max(overflow.right, 0);
        const yMin = max(overflow.top, 0);
        const yMax = max(overflow.bottom, 0);
        if (isYAxis) {
          availableWidth = width - 2 * (xMin !== 0 || xMax !== 0 ? xMin + xMax : max(overflow.left, overflow.right));
        } else {
          availableHeight = height - 2 * (yMin !== 0 || yMax !== 0 ? yMin + yMax : max(overflow.top, overflow.bottom));
        }
      }
      await apply({
        ...state,
        availableWidth,
        availableHeight
      });
      const nextDimensions = await platform2.getDimensions(elements.floating);
      if (width !== nextDimensions.width || height !== nextDimensions.height) {
        return {
          reset: {
            rects: true
          }
        };
      }
      return {};
    }
  };
};

// node_modules/.pnpm/@floating-ui+utils@0.2.11/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function hasWindow() {
  return typeof window !== "undefined";
}
function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || "").toLowerCase();
  }
  return "#document";
}
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Node || value instanceof getWindow(value).Node;
}
function isElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
  if (!hasWindow() || typeof ShadowRoot === "undefined") {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
function isOverflowElement(element) {
  const {
    overflow,
    overflowX,
    overflowY,
    display
  } = getComputedStyle2(element);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && display !== "inline" && display !== "contents";
}
function isTableElement(element) {
  return /^(table|td|th)$/.test(getNodeName(element));
}
function isTopLayer(element) {
  try {
    if (element.matches(":popover-open")) {
      return true;
    }
  } catch (_e) {
  }
  try {
    return element.matches(":modal");
  } catch (_e) {
    return false;
  }
}
var willChangeRe = /transform|translate|scale|rotate|perspective|filter/;
var containRe = /paint|layout|strict|content/;
var isNotNone = (value) => !!value && value !== "none";
var isWebKitValue;
function isContainingBlock(elementOrCss) {
  const css = isElement(elementOrCss) ? getComputedStyle2(elementOrCss) : elementOrCss;
  return isNotNone(css.transform) || isNotNone(css.translate) || isNotNone(css.scale) || isNotNone(css.rotate) || isNotNone(css.perspective) || !isWebKit() && (isNotNone(css.backdropFilter) || isNotNone(css.filter)) || willChangeRe.test(css.willChange || "") || containRe.test(css.contain || "");
}
function getContainingBlock(element) {
  let currentNode = getParentNode(element);
  while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode;
    } else if (isTopLayer(currentNode)) {
      return null;
    }
    currentNode = getParentNode(currentNode);
  }
  return null;
}
function isWebKit() {
  if (isWebKitValue == null) {
    isWebKitValue = typeof CSS !== "undefined" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none");
  }
  return isWebKitValue;
}
function isLastTraversableNode(node) {
  return /^(html|body|#document)$/.test(getNodeName(node));
}
function getComputedStyle2(element) {
  return getWindow(element).getComputedStyle(element);
}
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  return {
    scrollLeft: element.scrollX,
    scrollTop: element.scrollY
  };
}
function getParentNode(node) {
  if (getNodeName(node) === "html") {
    return node;
  }
  const result = (
    // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot || // DOM Element detected.
    node.parentNode || // ShadowRoot detected.
    isShadowRoot(node) && node.host || // Fallback.
    getDocumentElement(node)
  );
  return isShadowRoot(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return node.ownerDocument ? node.ownerDocument.body : node.body;
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list, traverseIframes) {
  var _node$ownerDocument2;
  if (list === void 0) {
    list = [];
  }
  if (traverseIframes === void 0) {
    traverseIframes = true;
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
  const win = getWindow(scrollableAncestor);
  if (isBody) {
    const frameElement = getFrameElement(win);
    return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
  } else {
    return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
  }
}
function getFrameElement(win) {
  return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}

// node_modules/.pnpm/@floating-ui+dom@1.7.6/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function getCssDimensions(element) {
  const css = getComputedStyle2(element);
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}
function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element;
}
function getScale(element) {
  const domElement = unwrapElement(element);
  if (!isHTMLElement(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const {
    width,
    height,
    $: $2
  } = getCssDimensions(domElement);
  let x2 = ($2 ? round(rect.width) : rect.width) / width;
  let y3 = ($2 ? round(rect.height) : rect.height) / height;
  if (!x2 || !Number.isFinite(x2)) {
    x2 = 1;
  }
  if (!y3 || !Number.isFinite(y3)) {
    y3 = 1;
  }
  return {
    x: x2,
    y: y3
  };
}
var noOffsets = /* @__PURE__ */ createCoords(0);
function getVisualOffsets(element) {
  const win = getWindow(element);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) {
    return false;
  }
  return isFixed;
}
function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x2 = (clientRect.left + visualOffsets.x) / scale.x;
  let y3 = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement) {
    const win = getWindow(domElement);
    const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
    let currentWin = win;
    let currentIFrame = getFrameElement(currentWin);
    while (currentIFrame && offsetParent && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle2(currentIFrame);
      const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x2 *= iframeScale.x;
      y3 *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x2 += left;
      y3 += top;
      currentWin = getWindow(currentIFrame);
      currentIFrame = getFrameElement(currentWin);
    }
  }
  return rectToClientRect({
    width,
    height,
    x: x2,
    y: y3
  });
}
function getWindowScrollBarX(element, rect) {
  const leftScroll = getNodeScroll(element).scrollLeft;
  if (!rect) {
    return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
  }
  return rect.left + leftScroll;
}
function getHTMLOffset(documentElement, scroll) {
  const htmlRect = documentElement.getBoundingClientRect();
  const x2 = htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect);
  const y3 = htmlRect.top + scroll.scrollTop;
  return {
    x: x2,
    y: y3
  };
}
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let {
    elements,
    rect,
    offsetParent,
    strategy
  } = _ref;
  const isFixed = strategy === "fixed";
  const documentElement = getDocumentElement(offsetParent);
  const topLayer = elements ? isTopLayer(elements.floating) : false;
  if (offsetParent === documentElement || topLayer && isFixed) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
  };
}
function getClientRects(element) {
  return Array.from(element.getClientRects());
}
function getDocumentRect(element) {
  const html = getDocumentElement(element);
  const scroll = getNodeScroll(element);
  const body = element.ownerDocument.body;
  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x2 = -scroll.scrollLeft + getWindowScrollBarX(element);
  const y3 = -scroll.scrollTop;
  if (getComputedStyle2(body).direction === "rtl") {
    x2 += max(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x: x2,
    y: y3
  };
}
var SCROLLBAR_MAX = 25;
function getViewportRect(element, strategy) {
  const win = getWindow(element);
  const html = getDocumentElement(element);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x2 = 0;
  let y3 = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    const visualViewportBased = isWebKit();
    if (!visualViewportBased || visualViewportBased && strategy === "fixed") {
      x2 = visualViewport.offsetLeft;
      y3 = visualViewport.offsetTop;
    }
  }
  const windowScrollbarX = getWindowScrollBarX(html);
  if (windowScrollbarX <= 0) {
    const doc = html.ownerDocument;
    const body = doc.body;
    const bodyStyles = getComputedStyle(body);
    const bodyMarginInline = doc.compatMode === "CSS1Compat" ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
    const clippingStableScrollbarWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
    if (clippingStableScrollbarWidth <= SCROLLBAR_MAX) {
      width -= clippingStableScrollbarWidth;
    }
  } else if (windowScrollbarX <= SCROLLBAR_MAX) {
    width += windowScrollbarX;
  }
  return {
    width,
    height,
    x: x2,
    y: y3
  };
}
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect(element, true, strategy === "fixed");
  const top = clientRect.top + element.clientTop;
  const left = clientRect.left + element.clientLeft;
  const scale = isHTMLElement(element) ? getScale(element) : createCoords(1);
  const width = element.clientWidth * scale.x;
  const height = element.clientHeight * scale.y;
  const x2 = left * scale.x;
  const y3 = top * scale.y;
  return {
    width,
    height,
    x: x2,
    y: y3
  };
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === "viewport") {
    rect = getViewportRect(element, strategy);
  } else if (clippingAncestor === "document") {
    rect = getDocumentRect(getDocumentElement(element));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element);
    rect = {
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y,
      width: clippingAncestor.width,
      height: clippingAncestor.height
    };
  }
  return rectToClientRect(rect);
}
function hasFixedPositionAncestor(element, stopNode) {
  const parentNode = getParentNode(element);
  if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
    return false;
  }
  return getComputedStyle2(parentNode).position === "fixed" || hasFixedPositionAncestor(parentNode, stopNode);
}
function getClippingElementAncestors(element, cache) {
  const cachedResult = cache.get(element);
  if (cachedResult) {
    return cachedResult;
  }
  let result = getOverflowAncestors(element, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
  let currentContainingBlockComputedStyle = null;
  const elementIsFixed = getComputedStyle2(element).position === "fixed";
  let currentNode = elementIsFixed ? getParentNode(element) : element;
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle2(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    if (!currentNodeIsContaining && computedStyle.position === "fixed") {
      currentContainingBlockComputedStyle = null;
    }
    const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === "static" && !!currentContainingBlockComputedStyle && (currentContainingBlockComputedStyle.position === "absolute" || currentContainingBlockComputedStyle.position === "fixed") || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
    if (shouldDropCurrentNode) {
      result = result.filter((ancestor) => ancestor !== currentNode);
    } else {
      currentContainingBlockComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache.set(element, result);
  return result;
}
function getClippingRect(_ref) {
  let {
    element,
    boundary,
    rootBoundary,
    strategy
  } = _ref;
  const elementClippingAncestors = boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstRect = getClientRectFromClippingAncestor(element, clippingAncestors[0], strategy);
  let top = firstRect.top;
  let right = firstRect.right;
  let bottom = firstRect.bottom;
  let left = firstRect.left;
  for (let i8 = 1; i8 < clippingAncestors.length; i8++) {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestors[i8], strategy);
    top = max(rect.top, top);
    right = min(rect.right, right);
    bottom = min(rect.bottom, bottom);
    left = max(rect.left, left);
  }
  return {
    width: right - left,
    height: bottom - top,
    x: left,
    y: top
  };
}
function getDimensions(element) {
  const {
    width,
    height
  } = getCssDimensions(element);
  return {
    width,
    height
  };
}
function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === "fixed";
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  function setLeftRTLScrollbarOffset() {
    offsets.x = getWindowScrollBarX(documentElement);
  }
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    } else if (documentElement) {
      setLeftRTLScrollbarOffset();
    }
  }
  if (isFixed && !isOffsetParentAnElement && documentElement) {
    setLeftRTLScrollbarOffset();
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  const x2 = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x;
  const y3 = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y;
  return {
    x: x2,
    y: y3,
    width: rect.width,
    height: rect.height
  };
}
function isStaticPositioned(element) {
  return getComputedStyle2(element).position === "static";
}
function getTrueOffsetParent(element, polyfill) {
  if (!isHTMLElement(element) || getComputedStyle2(element).position === "fixed") {
    return null;
  }
  if (polyfill) {
    return polyfill(element);
  }
  let rawOffsetParent = element.offsetParent;
  if (getDocumentElement(element) === rawOffsetParent) {
    rawOffsetParent = rawOffsetParent.ownerDocument.body;
  }
  return rawOffsetParent;
}
function getOffsetParent(element, polyfill) {
  const win = getWindow(element);
  if (isTopLayer(element)) {
    return win;
  }
  if (!isHTMLElement(element)) {
    let svgOffsetParent = getParentNode(element);
    while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
      if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
        return svgOffsetParent;
      }
      svgOffsetParent = getParentNode(svgOffsetParent);
    }
    return win;
  }
  let offsetParent = getTrueOffsetParent(element, polyfill);
  while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
    return win;
  }
  return offsetParent || getContainingBlock(element) || win;
}
var getElementRects = async function(data) {
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
  const getDimensionsFn = this.getDimensions;
  const floatingDimensions = await getDimensionsFn(data.floating);
  return {
    reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
    floating: {
      x: 0,
      y: 0,
      width: floatingDimensions.width,
      height: floatingDimensions.height
    }
  };
};
function isRTL(element) {
  return getComputedStyle2(element).direction === "rtl";
}
var platform = {
  convertOffsetParentRelativeRectToViewportRelativeRect,
  getDocumentElement,
  getClippingRect,
  getOffsetParent,
  getElementRects,
  getClientRects,
  getDimensions,
  getScale,
  isElement,
  isRTL
};
function rectsAreEqual(a3, b3) {
  return a3.x === b3.x && a3.y === b3.y && a3.width === b3.width && a3.height === b3.height;
}
function observeMove(element, onMove) {
  let io = null;
  let timeoutId;
  const root = getDocumentElement(element);
  function cleanup() {
    var _io;
    clearTimeout(timeoutId);
    (_io = io) == null || _io.disconnect();
    io = null;
  }
  function refresh(skip, threshold) {
    if (skip === void 0) {
      skip = false;
    }
    if (threshold === void 0) {
      threshold = 1;
    }
    cleanup();
    const elementRectForRootMargin = element.getBoundingClientRect();
    const {
      left,
      top,
      width,
      height
    } = elementRectForRootMargin;
    if (!skip) {
      onMove();
    }
    if (!width || !height) {
      return;
    }
    const insetTop = floor(top);
    const insetRight = floor(root.clientWidth - (left + width));
    const insetBottom = floor(root.clientHeight - (top + height));
    const insetLeft = floor(left);
    const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
    const options = {
      rootMargin,
      threshold: max(0, min(1, threshold)) || 1
    };
    let isFirstUpdate = true;
    function handleObserve(entries) {
      const ratio = entries[0].intersectionRatio;
      if (ratio !== threshold) {
        if (!isFirstUpdate) {
          return refresh();
        }
        if (!ratio) {
          timeoutId = setTimeout(() => {
            refresh(false, 1e-7);
          }, 1e3);
        } else {
          refresh(false, ratio);
        }
      }
      if (ratio === 1 && !rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect())) {
        refresh();
      }
      isFirstUpdate = false;
    }
    try {
      io = new IntersectionObserver(handleObserve, {
        ...options,
        // Handle <iframe>s
        root: root.ownerDocument
      });
    } catch (_e) {
      io = new IntersectionObserver(handleObserve, options);
    }
    io.observe(element);
  }
  refresh(true);
  return cleanup;
}
function autoUpdate(reference, floating, update, options) {
  if (options === void 0) {
    options = {};
  }
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = typeof ResizeObserver === "function",
    layoutShift = typeof IntersectionObserver === "function",
    animationFrame = false
  } = options;
  const referenceEl = unwrapElement(reference);
  const ancestors = ancestorScroll || ancestorResize ? [...referenceEl ? getOverflowAncestors(referenceEl) : [], ...floating ? getOverflowAncestors(floating) : []] : [];
  ancestors.forEach((ancestor) => {
    ancestorScroll && ancestor.addEventListener("scroll", update, {
      passive: true
    });
    ancestorResize && ancestor.addEventListener("resize", update);
  });
  const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null;
  let reobserveFrame = -1;
  let resizeObserver = null;
  if (elementResize) {
    resizeObserver = new ResizeObserver((_ref) => {
      let [firstEntry] = _ref;
      if (firstEntry && firstEntry.target === referenceEl && resizeObserver && floating) {
        resizeObserver.unobserve(floating);
        cancelAnimationFrame(reobserveFrame);
        reobserveFrame = requestAnimationFrame(() => {
          var _resizeObserver;
          (_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
        });
      }
      update();
    });
    if (referenceEl && !animationFrame) {
      resizeObserver.observe(referenceEl);
    }
    if (floating) {
      resizeObserver.observe(floating);
    }
  }
  let frameId;
  let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
  if (animationFrame) {
    frameLoop();
  }
  function frameLoop() {
    const nextRefRect = getBoundingClientRect(reference);
    if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) {
      update();
    }
    prevRefRect = nextRefRect;
    frameId = requestAnimationFrame(frameLoop);
  }
  update();
  return () => {
    var _resizeObserver2;
    ancestors.forEach((ancestor) => {
      ancestorScroll && ancestor.removeEventListener("scroll", update);
      ancestorResize && ancestor.removeEventListener("resize", update);
    });
    cleanupIo == null || cleanupIo();
    (_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
    resizeObserver = null;
    if (animationFrame) {
      cancelAnimationFrame(frameId);
    }
  };
}
var offset2 = offset;
var shift2 = shift;
var flip2 = flip;
var size2 = size;
var arrow2 = arrow;
var computePosition2 = (reference, floating, options) => {
  const cache = /* @__PURE__ */ new Map();
  const mergedOptions = {
    platform,
    ...options
  };
  const platformWithCache = {
    ...mergedOptions.platform,
    _c: cache
  };
  return computePosition(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache
  });
};

// src/lib/lit-ui/floating.ts
var flip3 = flip2;
var shift3 = shift2;
var offset3 = offset2;
var arrow3 = arrow2;
var size3 = size2;
var computePosition3 = computePosition2;
var autoUpdatePosition = autoUpdate;

// src/components/ui/popover.ts
var supportsPopoverApi = !o5 && typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype;
var idCounter = 0;
var Popover = class extends TailwindElement {
  constructor() {
    super(...arguments);
    this.placement = "bottom";
    this.arrow = false;
    this.modal = false;
    this.offset = 8;
    this.matchTriggerWidth = false;
    this.disabled = false;
    this._internalOpen = false;
    this._controlled = false;
    this._uniqueId = `lui-popover-${++idCounter}`;
    this._panelId = `${this._uniqueId}-panel`;
    this.triggerEl = null;
    this.handleTriggerClick = (e7) => {
      if (this.disabled) return;
      e7.stopPropagation();
      this.toggle();
    };
    this.handleTriggerKeydown = (e7) => {
      if (this.disabled) return;
      if (e7.key === "Enter" || e7.key === " ") {
        e7.preventDefault();
        this.toggle();
      }
    };
    this.handlePopoverToggle = (e7) => {
      const toggleEvent = e7;
      if (toggleEvent.newState === "closed") {
        this.handleClose();
      }
    };
    this.handleDocumentClick = (e7) => {
      if (!this._internalOpen) return;
      if (e7.composedPath().includes(this)) return;
      this.handleClose();
    };
    this.handleDocumentKeydown = (e7) => {
      if (e7.key === "Escape" && this._internalOpen) {
        e7.preventDefault();
        this.handleClose();
      }
    };
    this.handleParentClose = () => {
      if (this._internalOpen) {
        this.handleClose();
      }
    };
    this.handleSentinelStartFocus = () => {
      const focusable = this.getFocusableElements();
      if (focusable.length > 0) {
        focusable[focusable.length - 1]?.focus();
      }
    };
    this.handleSentinelEndFocus = () => {
      const focusable = this.getFocusableElements();
      if (focusable.length > 0) {
        focusable[0]?.focus();
      }
    };
    this.handleFocusOut = (e7) => {
      if (!this._internalOpen || this.modal) return;
      const relatedTarget = e7.relatedTarget;
      if (!relatedTarget) return;
      const path = e7.composedPath();
      if (!path.includes(this)) {
        requestAnimationFrame(() => {
          if (this._internalOpen) {
            this.handleClose();
          }
        });
      }
    };
  }
  get open() {
    return this._internalOpen;
  }
  set open(value) {
    const old = this._internalOpen;
    this._controlled = true;
    this._internalOpen = value;
    this.requestUpdate("open", old);
  }
  static {
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: inline-block;
        position: relative;
      }

      .popover-panel {
        position: fixed;
        z-index: var(--ui-popover-z-index);
        pointer-events: auto;
        max-width: var(--ui-popover-max-width);
        width: max-content;
        opacity: 0;
        transform: scale(0.95);
        transition:
          opacity 150ms ease-out,
          transform 150ms ease-out,
          display 150ms allow-discrete,
          overlay 150ms allow-discrete;
      }

      /* Override UA popover styles so Floating UI coordinates work */
      .popover-panel[popover] {
        margin: 0;
        position: fixed;
        border: none;
        padding: 0;
        overflow: visible;
        background: transparent;
        color: inherit;
      }

      .popover-panel[data-open] {
        opacity: 1;
        transform: scale(1);
      }

      .popover-panel:popover-open {
        opacity: 1;
        transform: scale(1);
      }

      @starting-style {
        .popover-panel[data-open] {
          opacity: 0;
          transform: scale(0.95);
        }
        .popover-panel:popover-open {
          opacity: 0;
          transform: scale(0.95);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .popover-panel {
          transition: none;
        }
      }

      .popover-content {
        background: var(--ui-popover-bg);
        color: var(--ui-popover-text);
        border: 1px solid var(--ui-popover-border);
        border-radius: var(--ui-popover-radius);
        padding: var(--ui-popover-padding);
        box-shadow: var(--ui-popover-shadow);
      }

      .popover-arrow {
        position: absolute;
        width: var(--ui-popover-arrow-size);
        height: var(--ui-popover-arrow-size);
        background: var(--ui-popover-bg);
        border: 1px solid var(--ui-popover-border);
        transform: rotate(45deg);
        z-index: -1;
      }

      .focus-sentinel {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `
    ];
  }
  connectedCallback() {
    super.connectedCallback();
    if (o5) return;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    this.addEventListener(
      "popover-close-children",
      this.handleParentClose,
      { signal }
    );
    if (!supportsPopoverApi) {
      document.addEventListener("click", this.handleDocumentClick, { signal });
      document.addEventListener("keydown", this.handleDocumentKeydown, {
        signal
      });
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.abortController?.abort();
    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = void 0;
    if (this._internalOpen) {
      this._internalOpen = false;
    }
  }
  render() {
    return b2`
      <div
        class="popover-trigger"
        part="trigger"
        aria-haspopup="dialog"
        aria-expanded="${this._internalOpen}"
        aria-controls="${this._panelId}"
      >
        <slot
          @slotchange=${this.handleSlotChange}
          @click=${this.handleTriggerClick}
          @keydown=${this.handleTriggerKeydown}
        ></slot>
      </div>
      ${this._internalOpen && !o5 ? b2`
            <div
              id="${this._panelId}"
              role="dialog"
              part="popover"
              class="popover-panel"
              data-open
              ${supportsPopoverApi ? b2`` : A}
              aria-modal="${this.modal ? "true" : "false"}"
              @toggle=${this.handlePopoverToggle}
            >
              ${this.modal ? b2`<div
                    class="focus-sentinel"
                    tabindex="0"
                    @focus=${this.handleSentinelStartFocus}
                  ></div>` : A}
              <div class="popover-content" part="content">
                <slot name="content"></slot>
              </div>
              ${this.arrow ? b2`<div class="popover-arrow" part="arrow"></div>` : A}
              ${this.modal ? b2`<div
                    class="focus-sentinel"
                    tabindex="0"
                    @focus=${this.handleSentinelEndFocus}
                  ></div>` : A}
            </div>
          ` : A}
    `;
  }
  async updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has("_internalOpen") || changedProps.has("open")) {
      if (this._internalOpen) {
        await this.updateComplete;
        this.setupPanel();
        this.updatePosition();
        this.startAutoUpdate();
        this.moveFocusToContent();
      } else {
        this.cleanupAutoUpdate?.();
        this.cleanupAutoUpdate = void 0;
        this.restoreFocusToTrigger();
      }
    }
  }
  // --- Event handlers ---
  handleSlotChange(e7) {
    const slot = e7.target;
    const assigned = slot.assignedElements({ flatten: true });
    const trigger = assigned[0];
    if (trigger) {
      this.triggerEl = trigger;
    }
  }
  // --- Core behavior ---
  toggle() {
    if (this._internalOpen) {
      this.handleClose();
    } else {
      this.handleOpen();
    }
  }
  handleOpen() {
    if (this._controlled) {
      this.dispatchEvent(
        new CustomEvent("open-changed", {
          detail: { open: true },
          bubbles: true,
          composed: true
        })
      );
      return;
    }
    this._internalOpen = true;
  }
  handleClose() {
    this.dispatchEvent(
      new CustomEvent("popover-close-children", {
        bubbles: true,
        composed: true
      })
    );
    if (this._controlled) {
      this.dispatchEvent(
        new CustomEvent("open-changed", {
          detail: { open: false },
          bubbles: true,
          composed: true
        })
      );
      return;
    }
    this._internalOpen = false;
  }
  /**
   * Setup the native popover panel after it renders.
   * Must call showPopover() imperatively since shadow DOM
   * doesn't support declarative popovertarget reliably.
   */
  setupPanel() {
    const panel = this.renderRoot.querySelector(
      `#${this._panelId}`
    );
    if (!panel) return;
    if (supportsPopoverApi) {
      if (!panel.hasAttribute("popover")) {
        panel.setAttribute("popover", "auto");
      }
      try {
        panel.showPopover();
      } catch {
      }
    }
  }
  async updatePosition() {
    const panel = this.renderRoot.querySelector(
      `#${this._panelId}`
    );
    const arrowEl = this.renderRoot.querySelector(".popover-arrow");
    if (!this.triggerEl || !panel) return;
    const middleware = [offset3(this.offset), flip3(), shift3({ padding: 8 })];
    if (this.arrow && arrowEl) {
      middleware.push(arrow3({ element: arrowEl, padding: 4 }));
    }
    if (this.matchTriggerWidth) {
      middleware.push(
        size3({
          apply({ rects, elements }) {
            Object.assign(elements.floating.style, {
              width: `${rects.reference.width}px`
            });
          }
        })
      );
    }
    const {
      x: x2,
      y: y3,
      placement: resolvedPlacement,
      middlewareData
    } = await computePosition3(this.triggerEl, panel, {
      placement: this.placement,
      strategy: "fixed",
      middleware
    });
    this._currentPlacement = resolvedPlacement;
    Object.assign(panel.style, {
      left: `${x2}px`,
      top: `${y3}px`
    });
    if (this.arrow && middlewareData.arrow && arrowEl) {
      const { x: ax, y: ay } = middlewareData.arrow;
      const side = resolvedPlacement.split("-")[0];
      const staticSide = {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left"
      };
      const oppositeSide = staticSide[side] ?? "bottom";
      Object.assign(arrowEl.style, {
        left: ax != null ? `${ax}px` : "",
        top: ay != null ? `${ay}px` : "",
        [oppositeSide]: "-4px"
      });
    }
  }
  startAutoUpdate() {
    const panel = this.renderRoot.querySelector(
      `#${this._panelId}`
    );
    if (!this.triggerEl || !panel) return;
    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = autoUpdatePosition(
      this.triggerEl,
      panel,
      () => this.updatePosition()
    );
  }
  // --- Focus management ---
  moveFocusToContent() {
    requestAnimationFrame(() => {
      const panel = this.renderRoot.querySelector(
        `#${this._panelId}`
      );
      if (!panel) return;
      const focusable = this.getFocusableElements();
      if (focusable.length > 0) {
        focusable[0]?.focus();
      } else {
        panel.setAttribute("tabindex", "-1");
        panel.focus();
      }
      if (!this.modal) {
        panel.addEventListener("focusout", this.handleFocusOut, {
          signal: this.abortController?.signal
        });
      }
    });
  }
  restoreFocusToTrigger() {
    if (this.triggerEl) {
      this.triggerEl.focus();
    }
  }
  getFocusableElements() {
    const panel = this.renderRoot.querySelector(
      `#${this._panelId}`
    );
    if (!panel) return [];
    const contentSlot = panel.querySelector(
      'slot[name="content"]'
    );
    if (!contentSlot) return [];
    const assigned = contentSlot.assignedElements({ flatten: true });
    const focusable = [];
    for (const el of assigned) {
      if (this.isFocusable(el)) {
        focusable.push(el);
      }
      const children = el.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      for (const child of children) {
        focusable.push(child);
      }
    }
    return focusable;
  }
  isFocusable(el) {
    if (el.hasAttribute("disabled")) return false;
    const tabindex = el.getAttribute("tabindex");
    if (tabindex !== null && tabindex !== "-1") return true;
    const focusableTags = ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"];
    return focusableTags.includes(el.tagName);
  }
};
__decorateClass([
  n4({ type: String })
], Popover.prototype, "placement", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Popover.prototype, "open", 1);
__decorateClass([
  n4({ type: Boolean })
], Popover.prototype, "arrow", 2);
__decorateClass([
  n4({ type: Boolean })
], Popover.prototype, "modal", 2);
__decorateClass([
  n4({ type: Number })
], Popover.prototype, "offset", 2);
__decorateClass([
  n4({ type: Boolean, attribute: "match-trigger-width" })
], Popover.prototype, "matchTriggerWidth", 2);
__decorateClass([
  n4({ type: Boolean })
], Popover.prototype, "disabled", 2);
__decorateClass([
  r5()
], Popover.prototype, "_internalOpen", 2);
if (!customElements.get("lui-popover")) {
  customElements.define("lui-popover", Popover);
}

// src/components/ui/delay-group.ts
var TooltipDelayGroup = class {
  constructor() {
    /** Timestamp of the last tooltip close event */
    this.lastCloseTimestamp = 0;
    /** Currently-open tooltip instance (for force-close on new open) */
    this.activeInstance = null;
    /** Time window in ms for skip-delay behavior */
    this.windowMs = 300;
  }
  /** Record that a tooltip just closed */
  notifyClosed() {
    this.lastCloseTimestamp = Date.now();
    this.activeInstance = null;
  }
  /** Check if we're within the delay group window */
  isInGroupWindow() {
    return Date.now() - this.lastCloseTimestamp < this.windowMs;
  }
  /** Set the currently-active tooltip, force-closing the previous one if different */
  setActive(instance) {
    if (this.activeInstance && this.activeInstance !== instance) {
      this.activeInstance.hide();
    }
    this.activeInstance = instance;
  }
  /** Clear active instance if it matches the given instance */
  clearActive(instance) {
    if (this.activeInstance === instance) {
      this.activeInstance = null;
    }
  }
};
var delayGroup = new TooltipDelayGroup();

// src/components/ui/tooltip.ts
var Tooltip = class extends TailwindElement {
  constructor() {
    super(...arguments);
    this.content = "";
    this.placement = "top";
    this.showDelay = 300;
    this.hideDelay = 100;
    this.arrow = true;
    this.offset = 8;
    this.rich = false;
    this.tooltipTitle = "";
    this.disabled = false;
    this.open = false;
    this.triggerEl = null;
    this.handlePointerEnter = (e7) => {
      if (e7.pointerType === "touch") return;
      if (this.disabled) return;
      this.scheduleShow();
    };
    this.handlePointerLeave = (e7) => {
      if (e7.pointerType === "touch") return;
      this.scheduleHide();
    };
    this.handleFocusIn = () => {
      if (this.disabled) return;
      this.scheduleShow();
    };
    this.handleFocusOut = () => {
      this.scheduleHide();
    };
    this.handleKeyDown = (e7) => {
      if (e7.key === "Escape" && this.open) {
        e7.preventDefault();
        this.hide();
        delayGroup.notifyClosed();
      }
    };
    this.handleTooltipPointerEnter = () => {
      clearTimeout(this.hideTimeout);
    };
    this.handleTooltipPointerLeave = () => {
      this.scheduleHide();
    };
  }
  static {
    // ---------------------------------------------------------------------------
    // Styles
    // ---------------------------------------------------------------------------
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: inline-block;
        position: relative;
      }

      .tooltip-panel {
        position: fixed;
        z-index: var(--ui-tooltip-z-index);
        pointer-events: auto;
        max-width: var(--ui-tooltip-max-width);
        width: max-content;

        /* Animation: fade only (TIP-13 respected via prefers-reduced-motion) */
        opacity: 0;
        transition:
          opacity 150ms ease-out,
          display 150ms allow-discrete,
          overlay 150ms allow-discrete;
      }

      .tooltip-panel[data-open] {
        opacity: 1;
      }

      @starting-style {
        .tooltip-panel[data-open] {
          opacity: 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .tooltip-panel {
          transition: none;
        }
      }

      .tooltip-content {
        background: var(--ui-tooltip-bg);
        color: var(--ui-tooltip-text);
        border-radius: var(--ui-tooltip-radius);
        padding: var(--ui-tooltip-padding-y) var(--ui-tooltip-padding-x);
        font-size: var(--ui-tooltip-font-size);
        box-shadow: var(--ui-tooltip-shadow);
        line-height: 1.4;
      }

      /* Rich tooltip variant (TIP-10) */
      :host([rich]) .tooltip-content {
        padding: 0.75rem 1rem;
      }

      .tooltip-title {
        font-weight: 600;
        margin-bottom: 0.25rem;
      }

      .tooltip-description {
        opacity: 0.9;
      }

      /* Arrow (TIP-05) */
      .tooltip-arrow {
        position: absolute;
        width: var(--ui-tooltip-arrow-size);
        height: var(--ui-tooltip-arrow-size);
        background: var(--ui-tooltip-bg);
        transform: rotate(45deg);
      }
    `
    ];
  }
  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  connectedCallback() {
    super.connectedCallback();
    if (o5) return;
    this.abortController = new AbortController();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.abortController?.abort();
    this.cleanupAutoUpdate?.();
    clearTimeout(this.showTimeout);
    clearTimeout(this.hideTimeout);
    if (this.open) {
      this.open = false;
      if (this.triggerEl) {
        this.triggerEl.removeAttribute("aria-describedby");
      }
      delayGroup.clearActive(this);
      delayGroup.notifyClosed();
    }
  }
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  render() {
    return b2`
      <div class="tooltip-trigger" part="trigger">
        <slot
          @slotchange=${this.handleSlotChange}
          @pointerenter=${this.handlePointerEnter}
          @pointerleave=${this.handlePointerLeave}
          @focusin=${this.handleFocusIn}
          @focusout=${this.handleFocusOut}
          @keydown=${this.handleKeyDown}
        ></slot>
      </div>
      ${this.open && !o5 ? b2`
            <div
              id="tooltip"
              role="tooltip"
              part="tooltip"
              class="tooltip-panel"
              data-open
              @pointerenter=${this.handleTooltipPointerEnter}
              @pointerleave=${this.handleTooltipPointerLeave}
            >
              <div class="tooltip-content" part="content">
                ${this.rich ? b2`
                      <div class="tooltip-title">
                        ${this.tooltipTitle}
                        <slot name="title"></slot>
                      </div>
                      <div class="tooltip-description">
                        ${this.content}
                        <slot name="content"></slot>
                      </div>
                    ` : b2`
                      ${this.content}
                      <slot name="content"></slot>
                    `}
              </div>
              ${this.arrow ? b2`<div class="tooltip-arrow" part="arrow"></div>` : A}
            </div>
          ` : A}
    `;
  }
  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  handleSlotChange(e7) {
    const slot = e7.target;
    const assigned = slot.assignedElements({ flatten: true });
    const trigger = assigned[0];
    if (trigger) {
      this.triggerEl = trigger;
    }
  }
  // ---------------------------------------------------------------------------
  // Show/hide state machine
  // ---------------------------------------------------------------------------
  scheduleShow() {
    clearTimeout(this.hideTimeout);
    if (this.open) return;
    const delay = delayGroup.isInGroupWindow() ? 0 : this.showDelay;
    this.showTimeout = setTimeout(() => this.show(), delay);
  }
  scheduleHide() {
    clearTimeout(this.showTimeout);
    if (!this.open) return;
    this.hideTimeout = setTimeout(() => {
      this.hide();
      delayGroup.notifyClosed();
    }, this.hideDelay);
  }
  show() {
    this.open = true;
    if (this.triggerEl) {
      this.triggerEl.setAttribute("aria-describedby", "tooltip");
    }
    delayGroup.setActive(this);
    this.updateComplete.then(() => {
      this.updatePosition();
      this.startAutoUpdate();
    });
  }
  hide() {
    this.open = false;
    if (this.triggerEl) {
      this.triggerEl.removeAttribute("aria-describedby");
    }
    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = void 0;
    delayGroup.clearActive(this);
    clearTimeout(this.showTimeout);
    clearTimeout(this.hideTimeout);
  }
  // ---------------------------------------------------------------------------
  // Positioning (TIP-04, TIP-05, TIP-08)
  // ---------------------------------------------------------------------------
  async updatePosition() {
    const tooltipEl = this.renderRoot.querySelector("#tooltip");
    const arrowEl = this.renderRoot.querySelector(".tooltip-arrow");
    if (!this.triggerEl || !tooltipEl) return;
    const middleware = [
      offset3(this.offset),
      flip3(),
      shift3({ padding: 8 })
    ];
    if (this.arrow && arrowEl) {
      middleware.push(arrow3({ element: arrowEl, padding: 4 }));
    }
    const { x: x2, y: y3, placement: resolvedPlacement, middlewareData } = await computePosition3(this.triggerEl, tooltipEl, {
      placement: this.placement,
      strategy: "fixed",
      middleware
    });
    Object.assign(tooltipEl.style, {
      left: `${x2}px`,
      top: `${y3}px`
    });
    if (this.arrow && middlewareData.arrow && arrowEl) {
      const { x: ax, y: ay } = middlewareData.arrow;
      const side = resolvedPlacement.split("-")[0];
      const staticSide = {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left"
      };
      Object.assign(arrowEl.style, {
        left: ax != null ? `${ax}px` : "",
        top: ay != null ? `${ay}px` : "",
        [staticSide[side]]: "-4px"
      });
    }
  }
  startAutoUpdate() {
    const tooltipEl = this.renderRoot.querySelector("#tooltip");
    if (!this.triggerEl || !tooltipEl) return;
    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = autoUpdatePosition(
      this.triggerEl,
      tooltipEl,
      () => this.updatePosition()
    );
  }
};
__decorateClass([
  n4({ type: String })
], Tooltip.prototype, "content", 2);
__decorateClass([
  n4({ type: String })
], Tooltip.prototype, "placement", 2);
__decorateClass([
  n4({ type: Number, attribute: "show-delay" })
], Tooltip.prototype, "showDelay", 2);
__decorateClass([
  n4({ type: Number, attribute: "hide-delay" })
], Tooltip.prototype, "hideDelay", 2);
__decorateClass([
  n4({ type: Boolean })
], Tooltip.prototype, "arrow", 2);
__decorateClass([
  n4({ type: Number })
], Tooltip.prototype, "offset", 2);
__decorateClass([
  n4({ type: Boolean })
], Tooltip.prototype, "rich", 2);
__decorateClass([
  n4({ type: String, attribute: "tooltip-title" })
], Tooltip.prototype, "tooltipTitle", 2);
__decorateClass([
  n4({ type: Boolean })
], Tooltip.prototype, "disabled", 2);
__decorateClass([
  r5()
], Tooltip.prototype, "open", 2);

// src/components/ui/icons.ts
var toastIcons = {
  default: A,
  success: b2`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" class="toast-icon">
      <circle cx="12" cy="12" r="10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  `,
  error: b2`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" class="toast-icon">
      <circle cx="12" cy="12" r="10"/>
      <path d="m15 9-6 6"/>
      <path d="m9 9 6 6"/>
    </svg>
  `,
  warning: b2`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" class="toast-icon">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    </svg>
  `,
  info: b2`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" class="toast-icon">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4"/>
      <path d="M12 8h.01"/>
    </svg>
  `,
  loading: b2`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" class="toast-icon toast-icon-loading">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  `
};

// src/components/ui/toast.ts
var Toast = class extends TailwindElement {
  constructor() {
    super(...arguments);
    this.toastId = "";
    this.variant = "default";
    this.duration = 5e3;
    this.dismissible = true;
    this.position = "bottom-right";
    // ---------------------------------------------------------------------------
    // Internal state
    // ---------------------------------------------------------------------------
    this._remaining = 0;
    this._startTime = 0;
    this._timerId = null;
    this._paused = false;
    this._swiping = false;
    this._swipeX = 0;
    this._swipeStartX = 0;
    this._swipeStartTime = 0;
    // ---------------------------------------------------------------------------
    // Swipe-to-dismiss (TOAST-13)
    // ---------------------------------------------------------------------------
    this._handlePointerDown = (e7) => {
      if (e7.button !== 0) return;
      this._swipeStartX = e7.clientX;
      this._swipeStartTime = Date.now();
      this._swipeX = 0;
      this._swiping = true;
      this.setPointerCapture(e7.pointerId);
      this._pauseTimer();
    };
    this._handlePointerMove = (e7) => {
      if (!this._swiping) return;
      this._swipeX = e7.clientX - this._swipeStartX;
      this.style.transform = `translateX(${this._swipeX}px)`;
      this.style.opacity = String(1 - Math.abs(this._swipeX) / 200);
    };
    this._handlePointerUp = (e7) => {
      if (!this._swiping) return;
      this._swiping = false;
      this.releasePointerCapture(e7.pointerId);
      const distance = Math.abs(this._swipeX);
      const elapsed = Date.now() - this._swipeStartTime;
      const velocity = elapsed > 0 ? distance / elapsed : 0;
      if (distance > 80 || velocity > 0.11) {
        this.dispatchEvent(
          new CustomEvent("toast-close", {
            bubbles: true,
            composed: true,
            detail: { id: this.toastId, reason: "swipe" }
          })
        );
      } else {
        this.style.transition = "transform 200ms ease-out, opacity 200ms ease-out";
        this.style.transform = "";
        this.style.opacity = "";
        const cleanup = () => {
          this.style.transition = "";
          this.removeEventListener("transitionend", cleanup);
        };
        this.addEventListener("transitionend", cleanup, { once: true });
        this._resumeTimer();
      }
    };
    // ---------------------------------------------------------------------------
    // Hover/focus pause (TOAST-14)
    // ---------------------------------------------------------------------------
    this._handlePointerEnter = () => {
      if (!this._swiping) {
        this._pauseTimer();
      }
    };
    this._handlePointerLeave = () => {
      if (!this._swiping) {
        this._resumeTimer();
      }
    };
    this._handleFocusIn = () => {
      this._pauseTimer();
    };
    this._handleFocusOut = () => {
      if (!this._swiping) {
        this._resumeTimer();
      }
    };
  }
  static {
    // ---------------------------------------------------------------------------
    // Styles
    // ---------------------------------------------------------------------------
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: var(--ui-toast-padding);
        background: var(--ui-toast-bg);
        color: var(--ui-toast-text);
        border: 1px solid var(--ui-toast-border);
        border-radius: var(--ui-toast-radius);
        box-shadow: var(--ui-toast-shadow);
        max-width: var(--ui-toast-max-width);
        width: 100%;
        position: relative;
        touch-action: pan-y;
        cursor: default;
        user-select: none;
        box-sizing: border-box;
        pointer-events: auto;
      }

      /* Variant backgrounds and borders */
      :host([variant="success"]) {
        background: var(--ui-toast-success-bg);
        border-color: var(--ui-toast-success-border);
      }
      :host([variant="error"]) {
        background: var(--ui-toast-error-bg);
        border-color: var(--ui-toast-error-border);
      }
      :host([variant="warning"]) {
        background: var(--ui-toast-warning-bg);
        border-color: var(--ui-toast-warning-border);
      }
      :host([variant="info"]) {
        background: var(--ui-toast-info-bg);
        border-color: var(--ui-toast-info-border);
      }

      /* Variant icon colors */
      :host([variant="success"]) .toast-icon-wrapper { color: var(--ui-toast-success-icon); }
      :host([variant="error"]) .toast-icon-wrapper { color: var(--ui-toast-error-icon); }
      :host([variant="warning"]) .toast-icon-wrapper { color: var(--ui-toast-warning-icon); }
      :host([variant="info"]) .toast-icon-wrapper { color: var(--ui-toast-info-icon); }
      :host([variant="loading"]) .toast-icon-wrapper { color: var(--ui-toast-info-icon); }

      .toast-icon-wrapper {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        padding-top: 0.125rem;
      }

      .toast-icon-loading {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .toast-content {
        flex: 1;
        min-width: 0;
      }

      .toast-title {
        font-weight: 600;
        line-height: 1.4;
      }

      .toast-description {
        margin-top: 0.25rem;
        font-size: 0.875rem;
        opacity: 0.9;
        line-height: 1.4;
      }

      .toast-action {
        appearance: none;
        background: none;
        border: none;
        color: inherit;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer;
        padding: 0;
        margin-top: 0.5rem;
      }

      .toast-action:hover {
        opacity: 0.8;
      }

      .toast-close {
        appearance: none;
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 0.25rem;
        margin: -0.25rem -0.25rem -0.25rem 0;
        flex-shrink: 0;
        opacity: 0.5;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.25rem;
        transition: opacity 150ms;
      }

      .toast-close:hover {
        opacity: 1;
      }

      @media (prefers-reduced-motion: reduce) {
        .toast-icon-loading {
          animation: none;
        }
      }
    `
    ];
  }
  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  connectedCallback() {
    super.connectedCallback();
    this._abortController = new AbortController();
    const signal = this._abortController.signal;
    this._remaining = this.duration;
    if (this.duration > 0) {
      this._startTimer();
    }
    this.addEventListener("pointerdown", this._handlePointerDown, { signal });
    this.addEventListener("pointermove", this._handlePointerMove, { signal });
    this.addEventListener("pointerup", this._handlePointerUp, { signal });
    this.addEventListener("pointercancel", this._handlePointerUp, { signal });
    this.addEventListener("pointerenter", this._handlePointerEnter, { signal });
    this.addEventListener("pointerleave", this._handlePointerLeave, { signal });
    this.addEventListener("focusin", this._handleFocusIn, { signal });
    this.addEventListener("focusout", this._handleFocusOut, { signal });
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._abortController?.abort();
    this._clearTimer();
  }
  // ---------------------------------------------------------------------------
  // Timer management
  // ---------------------------------------------------------------------------
  _startTimer() {
    this._startTime = Date.now();
    this._timerId = setTimeout(() => this._handleAutoClose(), this._remaining);
  }
  _pauseTimer() {
    if (this._timerId === null) return;
    clearTimeout(this._timerId);
    this._timerId = null;
    this._remaining -= Date.now() - this._startTime;
    if (this._remaining < 0) this._remaining = 0;
    this._paused = true;
  }
  _resumeTimer() {
    if (!this._paused || this._remaining <= 0 || this.duration === 0) return;
    this._paused = false;
    this._startTimer();
  }
  _clearTimer() {
    if (this._timerId !== null) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }
  }
  _handleAutoClose() {
    this.onAutoClose?.();
    this.dispatchEvent(
      new CustomEvent("toast-close", {
        bubbles: true,
        composed: true,
        detail: { id: this.toastId, reason: "auto" }
      })
    );
  }
  // ---------------------------------------------------------------------------
  // Close / Action handlers
  // ---------------------------------------------------------------------------
  _handleClose() {
    this.dispatchEvent(
      new CustomEvent("toast-close", {
        bubbles: true,
        composed: true,
        detail: { id: this.toastId, reason: "dismiss" }
      })
    );
  }
  _handleAction() {
    this.action?.onClick();
    this.dispatchEvent(
      new CustomEvent("toast-close", {
        bubbles: true,
        composed: true,
        detail: { id: this.toastId, reason: "action" }
      })
    );
  }
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  render() {
    const isError = this.variant === "error";
    const icon = toastIcons[this.variant];
    return b2`
      <div
        class="toast-inner"
        role=${isError ? "alert" : "status"}
        aria-live=${isError ? A : "polite"}
        aria-atomic="true"
        style="display:contents"
      >
        ${icon !== A ? b2`<div class="toast-icon-wrapper">${icon}</div>` : A}

        <div class="toast-content">
          ${this.toastTitle ? b2`<div class="toast-title">${this.toastTitle}</div>` : A}
          ${this.description ? b2`<div class="toast-description">${this.description}</div>` : A}
          <slot></slot>
          ${this.action ? b2`<button class="toast-action" @click=${this._handleAction}>${this.action.label}</button>` : A}
        </div>

        ${this.dismissible ? b2`
            <button class="toast-close" @click=${this._handleClose} aria-label="Close notification">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                aria-hidden="true">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            </button>
          ` : A}
      </div>
    `;
  }
};
__decorateClass([
  n4({ type: String, attribute: "toast-id" })
], Toast.prototype, "toastId", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], Toast.prototype, "variant", 2);
__decorateClass([
  n4({ type: String, attribute: "toast-title" })
], Toast.prototype, "toastTitle", 2);
__decorateClass([
  n4({ type: String })
], Toast.prototype, "description", 2);
__decorateClass([
  n4({ type: Number })
], Toast.prototype, "duration", 2);
__decorateClass([
  n4({ type: Boolean })
], Toast.prototype, "dismissible", 2);
__decorateClass([
  n4({ attribute: false })
], Toast.prototype, "action", 2);
__decorateClass([
  n4({ type: String })
], Toast.prototype, "position", 2);
__decorateClass([
  n4({ attribute: false })
], Toast.prototype, "onAutoClose", 2);
if (!customElements.get("lui-toast")) {
  customElements.define("lui-toast", Toast);
}

// node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/directive-helpers.js
var { I: t5 } = j;
var i7 = (o8) => o8;
var s4 = () => document.createComment("");
var v2 = (o8, n6, e7) => {
  const l3 = o8._$AA.parentNode, d3 = void 0 === n6 ? o8._$AB : n6._$AA;
  if (void 0 === e7) {
    const i8 = l3.insertBefore(s4(), d3), n7 = l3.insertBefore(s4(), d3);
    e7 = new t5(i8, n7, o8, o8.options);
  } else {
    const t6 = e7._$AB.nextSibling, n7 = e7._$AM, c5 = n7 !== o8;
    if (c5) {
      let t7;
      e7._$AQ?.(o8), e7._$AM = o8, void 0 !== e7._$AP && (t7 = o8._$AU) !== n7._$AU && e7._$AP(t7);
    }
    if (t6 !== d3 || c5) {
      let o9 = e7._$AA;
      for (; o9 !== t6; ) {
        const t7 = i7(o9).nextSibling;
        i7(l3).insertBefore(o9, d3), o9 = t7;
      }
    }
  }
  return e7;
};
var u3 = (o8, t6, i8 = o8) => (o8._$AI(t6, i8), o8);
var m2 = {};
var p3 = (o8, t6 = m2) => o8._$AH = t6;
var M2 = (o8) => o8._$AH;
var h3 = (o8) => {
  o8._$AR(), o8._$AA.remove();
};

// node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/directives/repeat.js
var u4 = (e7, s5, t6) => {
  const r6 = /* @__PURE__ */ new Map();
  for (let l3 = s5; l3 <= t6; l3++) r6.set(e7[l3], l3);
  return r6;
};
var c4 = e6(class extends i5 {
  constructor(e7) {
    if (super(e7), e7.type !== t4.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(e7, s5, t6) {
    let r6;
    void 0 === t6 ? t6 = s5 : void 0 !== s5 && (r6 = s5);
    const l3 = [], o8 = [];
    let i8 = 0;
    for (const s6 of e7) l3[i8] = r6 ? r6(s6, i8) : i8, o8[i8] = t6(s6, i8), i8++;
    return { values: o8, keys: l3 };
  }
  render(e7, s5, t6) {
    return this.dt(e7, s5, t6).values;
  }
  update(s5, [t6, r6, c5]) {
    const d3 = M2(s5), { values: p4, keys: a3 } = this.dt(t6, r6, c5);
    if (!Array.isArray(d3)) return this.ut = a3, p4;
    const h4 = this.ut ??= [], v3 = [];
    let m3, y3, x2 = 0, j2 = d3.length - 1, k2 = 0, w2 = p4.length - 1;
    for (; x2 <= j2 && k2 <= w2; ) if (null === d3[x2]) x2++;
    else if (null === d3[j2]) j2--;
    else if (h4[x2] === a3[k2]) v3[k2] = u3(d3[x2], p4[k2]), x2++, k2++;
    else if (h4[j2] === a3[w2]) v3[w2] = u3(d3[j2], p4[w2]), j2--, w2--;
    else if (h4[x2] === a3[w2]) v3[w2] = u3(d3[x2], p4[w2]), v2(s5, v3[w2 + 1], d3[x2]), x2++, w2--;
    else if (h4[j2] === a3[k2]) v3[k2] = u3(d3[j2], p4[k2]), v2(s5, d3[x2], d3[j2]), j2--, k2++;
    else if (void 0 === m3 && (m3 = u4(a3, k2, w2), y3 = u4(h4, x2, j2)), m3.has(h4[x2])) if (m3.has(h4[j2])) {
      const e7 = y3.get(a3[k2]), t7 = void 0 !== e7 ? d3[e7] : null;
      if (null === t7) {
        const e8 = v2(s5, d3[x2]);
        u3(e8, p4[k2]), v3[k2] = e8;
      } else v3[k2] = u3(t7, p4[k2]), v2(s5, d3[x2], t7), d3[e7] = null;
      k2++;
    } else h3(d3[j2]), j2--;
    else h3(d3[x2]), x2++;
    for (; k2 <= w2; ) {
      const e7 = v2(s5, v3[w2 + 1]);
      u3(e7, p4[k2]), v3[k2++] = e7;
    }
    for (; x2 <= j2; ) {
      const e7 = d3[x2++];
      null !== e7 && h3(e7);
    }
    return this.ut = a3, p3(s5, v3), E;
  }
});

// src/components/ui/state.ts
var ToastState = class {
  constructor() {
    this._toasts = [];
    this._subscribers = /* @__PURE__ */ new Set();
  }
  get toasts() {
    return this._toasts;
  }
  subscribe(fn) {
    this._subscribers.add(fn);
    return () => this._subscribers.delete(fn);
  }
  _notify() {
    this._subscribers.forEach((fn) => fn());
  }
  add(toast) {
    this._toasts = [toast, ...this._toasts];
    this._notify();
  }
  dismiss(id) {
    const toast = this._toasts.find((t6) => t6.id === id);
    this._toasts = this._toasts.filter((t6) => t6.id !== id);
    toast?.onDismiss?.();
    this._notify();
  }
  dismissAll() {
    this._toasts.forEach((t6) => t6.onDismiss?.());
    this._toasts = [];
    this._notify();
  }
  update(id, updates) {
    this._toasts = this._toasts.map(
      (t6) => t6.id === id ? { ...t6, ...updates } : t6
    );
    this._notify();
  }
};
var toastState = new ToastState();

// src/components/ui/toaster.ts
var Toaster = class extends TailwindElement {
  constructor() {
    super(...arguments);
    this.position = "bottom-right";
    this.maxVisible = 3;
    this.gap = 12;
    this._toasts = [];
    this._unsubscribe = null;
    this._popoverEl = null;
  }
  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  get _visibleToasts() {
    return this._toasts.slice(0, this.maxVisible);
  }
  static {
    // ---------------------------------------------------------------------------
    // Styles
    // ---------------------------------------------------------------------------
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: contents;
      }

      .toaster-wrapper {
        /* Override UA popover styles */
        margin: 0;
        border: none;
        padding: 0;
        background: transparent;
        overflow: visible;
        /* Layout */
        position: fixed;
        z-index: var(--ui-toast-z-index);
        display: flex;
        flex-direction: column;
        gap: var(--ui-toast-gap);
        pointer-events: none;
        max-height: 100vh;
        width: var(--ui-toast-max-width);
      }

      /* Bottom positions: newest at bottom (column-reverse stacks upward) */
      :host([position="bottom-right"]) .toaster-wrapper,
      :host([position="bottom-left"]) .toaster-wrapper,
      :host([position="bottom-center"]) .toaster-wrapper {
        flex-direction: column-reverse;
      }

      /* Position mapping */
      :host([position="bottom-right"]) .toaster-wrapper { bottom: 1rem; right: 1rem; }
      :host([position="bottom-left"]) .toaster-wrapper { bottom: 1rem; left: 1rem; }
      :host([position="bottom-center"]) .toaster-wrapper { bottom: 1rem; left: 50%; transform: translateX(-50%); }
      :host([position="top-right"]) .toaster-wrapper { top: 1rem; right: 1rem; }
      :host([position="top-left"]) .toaster-wrapper { top: 1rem; left: 1rem; }
      :host([position="top-center"]) .toaster-wrapper { top: 1rem; left: 50%; transform: translateX(-50%); }

      /* Toast entry/exit animations */
      lui-toast {
        opacity: 0;
        transition:
          opacity 200ms ease-out,
          transform 200ms ease-out;
      }

      lui-toast[data-open] {
        opacity: 1;
        transform: translateY(0);
      }

      @starting-style {
        lui-toast[data-open] {
          opacity: 0;
        }
      }

      /* Exiting state */
      lui-toast[data-exiting] {
        opacity: 0;
        transition:
          opacity 150ms ease-in,
          transform 150ms ease-in;
      }

      @media (prefers-reduced-motion: reduce) {
        lui-toast,
        lui-toast[data-open],
        lui-toast[data-exiting] {
          transition: none;
        }
      }

      /* Screen reader only */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    `
    ];
  }
  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  connectedCallback() {
    super.connectedCallback();
    if (o5) return;
    this._unsubscribe = toastState.subscribe(() => {
      this._toasts = [...toastState.toasts];
      if (this._toasts.length > 0) {
        this.updateComplete.then(() => this._showPopover());
      }
    });
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._unsubscribe = null;
  }
  // ---------------------------------------------------------------------------
  // Popover management (TOAST-17)
  // ---------------------------------------------------------------------------
  _showPopover() {
    if (!this._popoverEl) {
      this._popoverEl = this.renderRoot.querySelector(".toaster-wrapper");
    }
    if (this._popoverEl && !this._popoverEl.matches(":popover-open")) {
      try {
        this._popoverEl.showPopover();
      } catch {
      }
    }
  }
  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  _handleToastClose(e7) {
    const { id } = e7.detail;
    toastState.dismiss(id);
  }
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  render() {
    const visible = this._visibleToasts;
    return b2`
      <!-- Pre-registered live regions for accessibility (TOAST-08) -->
      <div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
        ${visible.filter((t6) => t6.variant !== "error").map(
      (t6) => b2`<div>${t6.title ?? ""}${t6.description ? ` ${t6.description}` : ""}</div>`
    )}
      </div>
      <div role="alert" aria-atomic="true" class="sr-only">
        ${visible.filter((t6) => t6.variant === "error").map(
      (t6) => b2`<div>${t6.title ?? ""}${t6.description ? ` ${t6.description}` : ""}</div>`
    )}
      </div>

      <div
        class="toaster-wrapper"
        popover="manual"
        part="container"
      >
        ${c4(
      visible,
      (t6) => t6.id,
      (t6) => b2`
            <lui-toast
              toast-id=${t6.id}
              variant=${t6.variant}
              toast-title=${t6.title ?? ""}
              description=${t6.description ?? ""}
              .duration=${t6.duration}
              .dismissible=${t6.dismissible}
              .action=${t6.action}
              .position=${this.position}
              .onAutoClose=${t6.onAutoClose}
              data-open
              @toast-close=${this._handleToastClose}
            >
            </lui-toast>
          `
    )}
      </div>
    `;
  }
};
__decorateClass([
  n4({ type: String, reflect: true })
], Toaster.prototype, "position", 2);
__decorateClass([
  n4({ type: Number, attribute: "max-visible" })
], Toaster.prototype, "maxVisible", 2);
__decorateClass([
  n4({ type: Number })
], Toaster.prototype, "gap", 2);
__decorateClass([
  r5()
], Toaster.prototype, "_toasts", 2);
if (!customElements.get("lui-toaster")) {
  customElements.define("lui-toaster", Toaster);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/constants.js
var daysInYear = 365.2425;
var maxTime = Math.pow(10, 8) * 24 * 60 * 60 * 1e3;
var minTime = -maxTime;
var millisecondsInWeek = 6048e5;
var millisecondsInDay = 864e5;
var millisecondsInMinute = 6e4;
var millisecondsInHour = 36e5;
var millisecondsInSecond = 1e3;
var secondsInHour = 3600;
var secondsInDay = secondsInHour * 24;
var secondsInWeek = secondsInDay * 7;
var secondsInYear = secondsInDay * daysInYear;
var secondsInMonth = secondsInYear / 12;
var secondsInQuarter = secondsInMonth * 3;
var constructFromSymbol = Symbol.for("constructDateFrom");

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/constructFrom.js
function constructFrom(date, value) {
  if (typeof date === "function") return date(value);
  if (date && typeof date === "object" && constructFromSymbol in date)
    return date[constructFromSymbol](value);
  if (date instanceof Date) return new date.constructor(value);
  return new Date(value);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/toDate.js
function toDate(argument, context) {
  return constructFrom(context || argument, argument);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/addDays.js
function addDays(date, amount, options) {
  const _date = toDate(date, options?.in);
  if (isNaN(amount)) return constructFrom(options?.in || date, NaN);
  if (!amount) return _date;
  _date.setDate(_date.getDate() + amount);
  return _date;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/addMonths.js
function addMonths(date, amount, options) {
  const _date = toDate(date, options?.in);
  if (isNaN(amount)) return constructFrom(options?.in || date, NaN);
  if (!amount) {
    return _date;
  }
  const dayOfMonth = _date.getDate();
  const endOfDesiredMonth = constructFrom(options?.in || date, _date.getTime());
  endOfDesiredMonth.setMonth(_date.getMonth() + amount + 1, 0);
  const daysInMonth = endOfDesiredMonth.getDate();
  if (dayOfMonth >= daysInMonth) {
    return endOfDesiredMonth;
  } else {
    _date.setFullYear(
      endOfDesiredMonth.getFullYear(),
      endOfDesiredMonth.getMonth(),
      dayOfMonth
    );
    return _date;
  }
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/defaultOptions.js
var defaultOptions = {};
function getDefaultOptions() {
  return defaultOptions;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfWeek.js
function startOfWeek(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const _date = toDate(date, options?.in);
  const day = _date.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  _date.setDate(_date.getDate() - diff);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfISOWeek.js
function startOfISOWeek(date, options) {
  return startOfWeek(date, { ...options, weekStartsOn: 1 });
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getISOWeekYear.js
function getISOWeekYear(date, options) {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();
  const fourthOfJanuaryOfNextYear = constructFrom(_date, 0);
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);
  const fourthOfJanuaryOfThisYear = constructFrom(_date, 0);
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);
  if (_date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (_date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/getTimezoneOffsetInMilliseconds.js
function getTimezoneOffsetInMilliseconds(date) {
  const _date = toDate(date);
  const utcDate = new Date(
    Date.UTC(
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds()
    )
  );
  utcDate.setUTCFullYear(_date.getFullYear());
  return +date - +utcDate;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/normalizeDates.js
function normalizeDates(context, ...dates) {
  const normalize = constructFrom.bind(
    null,
    context || dates.find((date) => typeof date === "object")
  );
  return dates.map(normalize);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfDay.js
function startOfDay(date, options) {
  const _date = toDate(date, options?.in);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/differenceInCalendarDays.js
function differenceInCalendarDays(laterDate, earlierDate, options) {
  const [laterDate_, earlierDate_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate
  );
  const laterStartOfDay = startOfDay(laterDate_);
  const earlierStartOfDay = startOfDay(earlierDate_);
  const laterTimestamp = +laterStartOfDay - getTimezoneOffsetInMilliseconds(laterStartOfDay);
  const earlierTimestamp = +earlierStartOfDay - getTimezoneOffsetInMilliseconds(earlierStartOfDay);
  return Math.round((laterTimestamp - earlierTimestamp) / millisecondsInDay);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfISOWeekYear.js
function startOfISOWeekYear(date, options) {
  const year = getISOWeekYear(date, options);
  const fourthOfJanuary = constructFrom(options?.in || date, 0);
  fourthOfJanuary.setFullYear(year, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  return startOfISOWeek(fourthOfJanuary);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/addWeeks.js
function addWeeks(date, amount, options) {
  return addDays(date, amount * 7, options);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/constructNow.js
function constructNow(date) {
  return constructFrom(date, Date.now());
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isSameDay.js
function isSameDay(laterDate, earlierDate, options) {
  const [dateLeft_, dateRight_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate
  );
  return +startOfDay(dateLeft_) === +startOfDay(dateRight_);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isDate.js
function isDate(value) {
  return value instanceof Date || typeof value === "object" && Object.prototype.toString.call(value) === "[object Date]";
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isValid.js
function isValid(date) {
  return !(!isDate(date) && typeof date !== "number" || isNaN(+toDate(date)));
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/endOfMonth.js
function endOfMonth(date, options) {
  const _date = toDate(date, options?.in);
  const month = _date.getMonth();
  _date.setFullYear(_date.getFullYear(), month + 1, 0);
  _date.setHours(23, 59, 59, 999);
  return _date;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/normalizeInterval.js
function normalizeInterval(context, interval) {
  const [start, end] = normalizeDates(context, interval.start, interval.end);
  return { start, end };
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/eachDayOfInterval.js
function eachDayOfInterval(interval, options) {
  const { start, end } = normalizeInterval(options?.in, interval);
  let reversed = +start > +end;
  const endTime = reversed ? +start : +end;
  const date = reversed ? end : start;
  date.setHours(0, 0, 0, 0);
  let step = options?.step ?? 1;
  if (!step) return [];
  if (step < 0) {
    step = -step;
    reversed = !reversed;
  }
  const dates = [];
  while (+date <= endTime) {
    dates.push(constructFrom(start, date));
    date.setDate(date.getDate() + step);
    date.setHours(0, 0, 0, 0);
  }
  return reversed ? dates.reverse() : dates;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfMonth.js
function startOfMonth(date, options) {
  const _date = toDate(date, options?.in);
  _date.setDate(1);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfYear.js
function startOfYear(date, options) {
  const date_ = toDate(date, options?.in);
  date_.setFullYear(date_.getFullYear(), 0, 1);
  date_.setHours(0, 0, 0, 0);
  return date_;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/endOfWeek.js
function endOfWeek(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const _date = toDate(date, options?.in);
  const day = _date.getDay();
  const diff = (day < weekStartsOn ? -7 : 0) + 6 - (day - weekStartsOn);
  _date.setDate(_date.getDate() + diff);
  _date.setHours(23, 59, 59, 999);
  return _date;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds"
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds"
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours"
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours"
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days"
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks"
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months"
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months"
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years"
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years"
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years"
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years"
  }
};
var formatDistance = (token, count, options) => {
  let result;
  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", count.toString());
  }
  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "in " + result;
    } else {
      return result + " ago";
    }
  }
  return result;
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/_lib/buildFormatLongFn.js
function buildFormatLongFn(args) {
  return (options = {}) => {
    const width = options.width ? String(options.width) : args.defaultWidth;
    const format2 = args.formats[width] || args.formats[args.defaultWidth];
    return format2;
  };
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US/_lib/formatLong.js
var dateFormats = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
};
var timeFormats = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
};
var dateTimeFormats = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
};
var formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full"
  })
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
};
var formatRelative = (token, _date, _baseDate, _options) => formatRelativeLocale[token];

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/_lib/buildLocalizeFn.js
function buildLocalizeFn(args) {
  return (value, options) => {
    const context = options?.context ? String(options.context) : "standalone";
    let valuesArray;
    if (context === "formatting" && args.formattingValues) {
      const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      const width = options?.width ? String(options.width) : defaultWidth;
      valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      const defaultWidth = args.defaultWidth;
      const width = options?.width ? String(options.width) : args.defaultWidth;
      valuesArray = args.values[width] || args.values[defaultWidth];
    }
    const index = args.argumentCallback ? args.argumentCallback(value) : value;
    return valuesArray[index];
  };
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US/_lib/localize.js
var eraValues = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
};
var quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
};
var monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
};
var dayValues = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
};
var dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  }
};
var ordinalNumber = (dirtyNumber, _options) => {
  const number = Number(dirtyNumber);
  const rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + "st";
      case 2:
        return number + "nd";
      case 3:
        return number + "rd";
    }
  }
  return number + "th";
};
var localize = {
  ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide"
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => quarter - 1
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide"
  })
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/_lib/buildMatchFn.js
function buildMatchFn(args) {
  return (string, options = {}) => {
    const width = options.width;
    const matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
    const matchResult = string.match(matchPattern);
    if (!matchResult) {
      return null;
    }
    const matchedString = matchResult[0];
    const parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
    const key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString)) : (
      // [TODO] -- I challenge you to fix the type
      findKey(parsePatterns, (pattern) => pattern.test(matchedString))
    );
    let value;
    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback ? (
      // [TODO] -- I challenge you to fix the type
      options.valueCallback(value)
    ) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}
function findKey(object, predicate) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key) && predicate(object[key])) {
      return key;
    }
  }
  return void 0;
}
function findIndex(array, predicate) {
  for (let key = 0; key < array.length; key++) {
    if (predicate(array[key])) {
      return key;
    }
  }
  return void 0;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/_lib/buildMatchPatternFn.js
function buildMatchPatternFn(args) {
  return (string, options = {}) => {
    const matchResult = string.match(args.matchPattern);
    if (!matchResult) return null;
    const matchedString = matchResult[0];
    const parseResult = string.match(args.parsePattern);
    if (!parseResult) return null;
    let value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US/_lib/match.js
var matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern = /\d+/i;
var matchEraPatterns = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
};
var parseEraPatterns = {
  any: [/^b/i, /^(a|c)/i]
};
var matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
};
var parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
};
var parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
};
var matchDayPatterns = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
};
var parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
};
var matchDayPeriodPatterns = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
};
var parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i
  }
};
var match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: (value) => parseInt(value, 10)
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any"
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: (index) => index + 1
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any"
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any"
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any"
  })
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US.js
var enUS = {
  code: "en-US",
  formatDistance,
  formatLong,
  formatRelative,
  localize,
  match,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getDayOfYear.js
function getDayOfYear(date, options) {
  const _date = toDate(date, options?.in);
  const diff = differenceInCalendarDays(_date, startOfYear(_date));
  const dayOfYear = diff + 1;
  return dayOfYear;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getISOWeek.js
function getISOWeek(date, options) {
  const _date = toDate(date, options?.in);
  const diff = +startOfISOWeek(_date) - +startOfISOWeekYear(_date);
  return Math.round(diff / millisecondsInWeek) + 1;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getWeekYear.js
function getWeekYear(date, options) {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const firstWeekOfNextYear = constructFrom(options?.in || date, 0);
  firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
  firstWeekOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);
  const firstWeekOfThisYear = constructFrom(options?.in || date, 0);
  firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
  firstWeekOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);
  if (+_date >= +startOfNextYear) {
    return year + 1;
  } else if (+_date >= +startOfThisYear) {
    return year;
  } else {
    return year - 1;
  }
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfWeekYear.js
function startOfWeekYear(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const year = getWeekYear(date, options);
  const firstWeek = constructFrom(options?.in || date, 0);
  firstWeek.setFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setHours(0, 0, 0, 0);
  const _date = startOfWeek(firstWeek, options);
  return _date;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getWeek.js
function getWeek(date, options) {
  const _date = toDate(date, options?.in);
  const diff = +startOfWeek(_date, options) - +startOfWeekYear(_date, options);
  return Math.round(diff / millisecondsInWeek) + 1;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/addLeadingZeros.js
function addLeadingZeros(number, targetLength) {
  const sign = number < 0 ? "-" : "";
  const output = Math.abs(number).toString().padStart(targetLength, "0");
  return sign + output;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/format/lightFormatters.js
var lightFormatters = {
  // Year
  y(date, token) {
    const signedYear = date.getFullYear();
    const year = signedYear > 0 ? signedYear : 1 - signedYear;
    return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
  },
  // Month
  M(date, token) {
    const month = date.getMonth();
    return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
  },
  // Day of the month
  d(date, token) {
    return addLeadingZeros(date.getDate(), token.length);
  },
  // AM or PM
  a(date, token) {
    const dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return dayPeriodEnumValue.toUpperCase();
      case "aaa":
        return dayPeriodEnumValue;
      case "aaaaa":
        return dayPeriodEnumValue[0];
      case "aaaa":
      default:
        return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
    }
  },
  // Hour [1-12]
  h(date, token) {
    return addLeadingZeros(date.getHours() % 12 || 12, token.length);
  },
  // Hour [0-23]
  H(date, token) {
    return addLeadingZeros(date.getHours(), token.length);
  },
  // Minute
  m(date, token) {
    return addLeadingZeros(date.getMinutes(), token.length);
  },
  // Second
  s(date, token) {
    return addLeadingZeros(date.getSeconds(), token.length);
  },
  // Fraction of second
  S(date, token) {
    const numberOfDigits = token.length;
    const milliseconds = date.getMilliseconds();
    const fractionalSeconds = Math.trunc(
      milliseconds * Math.pow(10, numberOfDigits - 3)
    );
    return addLeadingZeros(fractionalSeconds, token.length);
  }
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/format/formatters.js
var dayPeriodEnum = {
  am: "am",
  pm: "pm",
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night"
};
var formatters = {
  // Era
  G: function(date, token, localize2) {
    const era = date.getFullYear() > 0 ? 1 : 0;
    switch (token) {
      // AD, BC
      case "G":
      case "GG":
      case "GGG":
        return localize2.era(era, { width: "abbreviated" });
      // A, B
      case "GGGGG":
        return localize2.era(era, { width: "narrow" });
      // Anno Domini, Before Christ
      case "GGGG":
      default:
        return localize2.era(era, { width: "wide" });
    }
  },
  // Year
  y: function(date, token, localize2) {
    if (token === "yo") {
      const signedYear = date.getFullYear();
      const year = signedYear > 0 ? signedYear : 1 - signedYear;
      return localize2.ordinalNumber(year, { unit: "year" });
    }
    return lightFormatters.y(date, token);
  },
  // Local week-numbering year
  Y: function(date, token, localize2, options) {
    const signedWeekYear = getWeekYear(date, options);
    const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;
    if (token === "YY") {
      const twoDigitYear = weekYear % 100;
      return addLeadingZeros(twoDigitYear, 2);
    }
    if (token === "Yo") {
      return localize2.ordinalNumber(weekYear, { unit: "year" });
    }
    return addLeadingZeros(weekYear, token.length);
  },
  // ISO week-numbering year
  R: function(date, token) {
    const isoWeekYear = getISOWeekYear(date);
    return addLeadingZeros(isoWeekYear, token.length);
  },
  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: function(date, token) {
    const year = date.getFullYear();
    return addLeadingZeros(year, token.length);
  },
  // Quarter
  Q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "Q":
        return String(quarter);
      // 01, 02, 03, 04
      case "QQ":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "Qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "QQQ":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "formatting"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "QQQQQ":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "formatting"
        });
      // 1st quarter, 2nd quarter, ...
      case "QQQQ":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone quarter
  q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "q":
        return String(quarter);
      // 01, 02, 03, 04
      case "qq":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "qqq":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "standalone"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "qqqqq":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "standalone"
        });
      // 1st quarter, 2nd quarter, ...
      case "qqqq":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // Month
  M: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      case "M":
      case "MM":
        return lightFormatters.M(date, token);
      // 1st, 2nd, ..., 12th
      case "Mo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "MMM":
        return localize2.month(month, {
          width: "abbreviated",
          context: "formatting"
        });
      // J, F, ..., D
      case "MMMMM":
        return localize2.month(month, {
          width: "narrow",
          context: "formatting"
        });
      // January, February, ..., December
      case "MMMM":
      default:
        return localize2.month(month, { width: "wide", context: "formatting" });
    }
  },
  // Stand-alone month
  L: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      // 1, 2, ..., 12
      case "L":
        return String(month + 1);
      // 01, 02, ..., 12
      case "LL":
        return addLeadingZeros(month + 1, 2);
      // 1st, 2nd, ..., 12th
      case "Lo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "LLL":
        return localize2.month(month, {
          width: "abbreviated",
          context: "standalone"
        });
      // J, F, ..., D
      case "LLLLL":
        return localize2.month(month, {
          width: "narrow",
          context: "standalone"
        });
      // January, February, ..., December
      case "LLLL":
      default:
        return localize2.month(month, { width: "wide", context: "standalone" });
    }
  },
  // Local week of year
  w: function(date, token, localize2, options) {
    const week = getWeek(date, options);
    if (token === "wo") {
      return localize2.ordinalNumber(week, { unit: "week" });
    }
    return addLeadingZeros(week, token.length);
  },
  // ISO week of year
  I: function(date, token, localize2) {
    const isoWeek = getISOWeek(date);
    if (token === "Io") {
      return localize2.ordinalNumber(isoWeek, { unit: "week" });
    }
    return addLeadingZeros(isoWeek, token.length);
  },
  // Day of the month
  d: function(date, token, localize2) {
    if (token === "do") {
      return localize2.ordinalNumber(date.getDate(), { unit: "date" });
    }
    return lightFormatters.d(date, token);
  },
  // Day of year
  D: function(date, token, localize2) {
    const dayOfYear = getDayOfYear(date);
    if (token === "Do") {
      return localize2.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
    }
    return addLeadingZeros(dayOfYear, token.length);
  },
  // Day of week
  E: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    switch (token) {
      // Tue
      case "E":
      case "EE":
      case "EEE":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "EEEEE":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "EEEEEE":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "EEEE":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Local day of week
  e: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (Nth day of week with current locale or weekStartsOn)
      case "e":
        return String(localDayOfWeek);
      // Padded numerical value
      case "ee":
        return addLeadingZeros(localDayOfWeek, 2);
      // 1st, 2nd, ..., 7th
      case "eo":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "eee":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "eeeee":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "eeeeee":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "eeee":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone local day of week
  c: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (same as in `e`)
      case "c":
        return String(localDayOfWeek);
      // Padded numerical value
      case "cc":
        return addLeadingZeros(localDayOfWeek, token.length);
      // 1st, 2nd, ..., 7th
      case "co":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "ccc":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "standalone"
        });
      // T
      case "ccccc":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "standalone"
        });
      // Tu
      case "cccccc":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "standalone"
        });
      // Tuesday
      case "cccc":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // ISO day of week
  i: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    switch (token) {
      // 2
      case "i":
        return String(isoDayOfWeek);
      // 02
      case "ii":
        return addLeadingZeros(isoDayOfWeek, token.length);
      // 2nd
      case "io":
        return localize2.ordinalNumber(isoDayOfWeek, { unit: "day" });
      // Tue
      case "iii":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "iiiii":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "iiiiii":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "iiii":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM or PM
  a: function(date, token, localize2) {
    const hours = date.getHours();
    const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "aaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "aaaaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM, PM, midnight, noon
  b: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours === 12) {
      dayPeriodEnumValue = dayPeriodEnum.noon;
    } else if (hours === 0) {
      dayPeriodEnumValue = dayPeriodEnum.midnight;
    } else {
      dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    }
    switch (token) {
      case "b":
      case "bb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "bbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "bbbbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // in the morning, in the afternoon, in the evening, at night
  B: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours >= 17) {
      dayPeriodEnumValue = dayPeriodEnum.evening;
    } else if (hours >= 12) {
      dayPeriodEnumValue = dayPeriodEnum.afternoon;
    } else if (hours >= 4) {
      dayPeriodEnumValue = dayPeriodEnum.morning;
    } else {
      dayPeriodEnumValue = dayPeriodEnum.night;
    }
    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "BBBBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Hour [1-12]
  h: function(date, token, localize2) {
    if (token === "ho") {
      let hours = date.getHours() % 12;
      if (hours === 0) hours = 12;
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return lightFormatters.h(date, token);
  },
  // Hour [0-23]
  H: function(date, token, localize2) {
    if (token === "Ho") {
      return localize2.ordinalNumber(date.getHours(), { unit: "hour" });
    }
    return lightFormatters.H(date, token);
  },
  // Hour [0-11]
  K: function(date, token, localize2) {
    const hours = date.getHours() % 12;
    if (token === "Ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Hour [1-24]
  k: function(date, token, localize2) {
    let hours = date.getHours();
    if (hours === 0) hours = 24;
    if (token === "ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Minute
  m: function(date, token, localize2) {
    if (token === "mo") {
      return localize2.ordinalNumber(date.getMinutes(), { unit: "minute" });
    }
    return lightFormatters.m(date, token);
  },
  // Second
  s: function(date, token, localize2) {
    if (token === "so") {
      return localize2.ordinalNumber(date.getSeconds(), { unit: "second" });
    }
    return lightFormatters.s(date, token);
  },
  // Fraction of second
  S: function(date, token) {
    return lightFormatters.S(date, token);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    if (timezoneOffset === 0) {
      return "Z";
    }
    switch (token) {
      // Hours and optional minutes
      case "X":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XX`
      case "XXXX":
      case "XX":
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XXX`
      case "XXXXX":
      case "XXX":
      // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Hours and optional minutes
      case "x":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xx`
      case "xxxx":
      case "xx":
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xxx`
      case "xxxxx":
      case "xxx":
      // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (GMT)
  O: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Short
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "OOOO":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Short
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "zzzz":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Seconds timestamp
  t: function(date, token, _localize) {
    const timestamp = Math.trunc(+date / 1e3);
    return addLeadingZeros(timestamp, token.length);
  },
  // Milliseconds timestamp
  T: function(date, token, _localize) {
    return addLeadingZeros(+date, token.length);
  }
};
function formatTimezoneShort(offset4, delimiter = "") {
  const sign = offset4 > 0 ? "-" : "+";
  const absOffset = Math.abs(offset4);
  const hours = Math.trunc(absOffset / 60);
  const minutes = absOffset % 60;
  if (minutes === 0) {
    return sign + String(hours);
  }
  return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
}
function formatTimezoneWithOptionalMinutes(offset4, delimiter) {
  if (offset4 % 60 === 0) {
    const sign = offset4 > 0 ? "-" : "+";
    return sign + addLeadingZeros(Math.abs(offset4) / 60, 2);
  }
  return formatTimezone(offset4, delimiter);
}
function formatTimezone(offset4, delimiter = "") {
  const sign = offset4 > 0 ? "-" : "+";
  const absOffset = Math.abs(offset4);
  const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
  const minutes = addLeadingZeros(absOffset % 60, 2);
  return sign + hours + delimiter + minutes;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/format/longFormatters.js
var dateLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "P":
      return formatLong2.date({ width: "short" });
    case "PP":
      return formatLong2.date({ width: "medium" });
    case "PPP":
      return formatLong2.date({ width: "long" });
    case "PPPP":
    default:
      return formatLong2.date({ width: "full" });
  }
};
var timeLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "p":
      return formatLong2.time({ width: "short" });
    case "pp":
      return formatLong2.time({ width: "medium" });
    case "ppp":
      return formatLong2.time({ width: "long" });
    case "pppp":
    default:
      return formatLong2.time({ width: "full" });
  }
};
var dateTimeLongFormatter = (pattern, formatLong2) => {
  const matchResult = pattern.match(/(P+)(p+)?/) || [];
  const datePattern = matchResult[1];
  const timePattern = matchResult[2];
  if (!timePattern) {
    return dateLongFormatter(pattern, formatLong2);
  }
  let dateTimeFormat;
  switch (datePattern) {
    case "P":
      dateTimeFormat = formatLong2.dateTime({ width: "short" });
      break;
    case "PP":
      dateTimeFormat = formatLong2.dateTime({ width: "medium" });
      break;
    case "PPP":
      dateTimeFormat = formatLong2.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      dateTimeFormat = formatLong2.dateTime({ width: "full" });
      break;
  }
  return dateTimeFormat.replace("{{date}}", dateLongFormatter(datePattern, formatLong2)).replace("{{time}}", timeLongFormatter(timePattern, formatLong2));
};
var longFormatters = {
  p: timeLongFormatter,
  P: dateTimeLongFormatter
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/protectedTokens.js
var dayOfYearTokenRE = /^D+$/;
var weekYearTokenRE = /^Y+$/;
var throwTokens = ["D", "DD", "YY", "YYYY"];
function isProtectedDayOfYearToken(token) {
  return dayOfYearTokenRE.test(token);
}
function isProtectedWeekYearToken(token) {
  return weekYearTokenRE.test(token);
}
function warnOrThrowProtectedError(token, format2, input) {
  const _message = message(token, format2, input);
  console.warn(_message);
  if (throwTokens.includes(token)) throw new RangeError(_message);
}
function message(token, format2, input) {
  const subject = token[0] === "Y" ? "years" : "days of the month";
  return `Use \`${token.toLowerCase()}\` instead of \`${token}\` (in \`${format2}\`) for formatting ${subject} to the input \`${input}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/format.js
var formattingTokensRegExp = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
var longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp = /^'([^]*?)'?$/;
var doubleQuoteRegExp = /''/g;
var unescapedLatinCharacterRegExp = /[a-zA-Z]/;
function format(date, formatStr, options) {
  const defaultOptions2 = getDefaultOptions();
  const locale = options?.locale ?? defaultOptions2.locale ?? enUS;
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const originalDate = toDate(date, options?.in);
  if (!isValid(originalDate)) {
    throw new RangeError("Invalid time value");
  }
  let parts = formatStr.match(longFormattingTokensRegExp).map((substring) => {
    const firstCharacter = substring[0];
    if (firstCharacter === "p" || firstCharacter === "P") {
      const longFormatter = longFormatters[firstCharacter];
      return longFormatter(substring, locale.formatLong);
    }
    return substring;
  }).join("").match(formattingTokensRegExp).map((substring) => {
    if (substring === "''") {
      return { isToken: false, value: "'" };
    }
    const firstCharacter = substring[0];
    if (firstCharacter === "'") {
      return { isToken: false, value: cleanEscapedString(substring) };
    }
    if (formatters[firstCharacter]) {
      return { isToken: true, value: substring };
    }
    if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
      throw new RangeError(
        "Format string contains an unescaped latin alphabet character `" + firstCharacter + "`"
      );
    }
    return { isToken: false, value: substring };
  });
  if (locale.localize.preprocessor) {
    parts = locale.localize.preprocessor(originalDate, parts);
  }
  const formatterOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale
  };
  return parts.map((part) => {
    if (!part.isToken) return part.value;
    const token = part.value;
    if (!options?.useAdditionalWeekYearTokens && isProtectedWeekYearToken(token) || !options?.useAdditionalDayOfYearTokens && isProtectedDayOfYearToken(token)) {
      warnOrThrowProtectedError(token, formatStr, String(date));
    }
    const formatter = formatters[token[0]];
    return formatter(originalDate, token, locale.localize, formatterOptions);
  }).join("");
}
function cleanEscapedString(input) {
  const matched = input.match(escapedStringRegExp);
  if (!matched) {
    return input;
  }
  return matched[1].replace(doubleQuoteRegExp, "'");
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getDefaultOptions.js
function getDefaultOptions2() {
  return Object.assign({}, getDefaultOptions());
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getISODay.js
function getISODay(date, options) {
  const day = toDate(date, options?.in).getDay();
  return day === 0 ? 7 : day;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getMonth.js
function getMonth(date, options) {
  return toDate(date, options?.in).getMonth();
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getYear.js
function getYear(date, options) {
  return toDate(date, options?.in).getFullYear();
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isAfter.js
function isAfter(date, dateToCompare) {
  return +toDate(date) > +toDate(dateToCompare);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isBefore.js
function isBefore(date, dateToCompare) {
  return +toDate(date) < +toDate(dateToCompare);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/transpose.js
function transpose(date, constructor) {
  const date_ = isConstructor(constructor) ? new constructor(0) : constructFrom(constructor, 0);
  date_.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  date_.setHours(
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
  return date_;
}
function isConstructor(constructor) {
  return typeof constructor === "function" && constructor.prototype?.constructor === constructor;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/Setter.js
var TIMEZONE_UNIT_PRIORITY = 10;
var Setter = class {
  subPriority = 0;
  validate(_utcDate, _options) {
    return true;
  }
};
var ValueSetter = class extends Setter {
  constructor(value, validateValue, setValue, priority, subPriority) {
    super();
    this.value = value;
    this.validateValue = validateValue;
    this.setValue = setValue;
    this.priority = priority;
    if (subPriority) {
      this.subPriority = subPriority;
    }
  }
  validate(date, options) {
    return this.validateValue(date, this.value, options);
  }
  set(date, flags, options) {
    return this.setValue(date, flags, this.value, options);
  }
};
var DateTimezoneSetter = class extends Setter {
  priority = TIMEZONE_UNIT_PRIORITY;
  subPriority = -1;
  constructor(context, reference) {
    super();
    this.context = context || ((date) => constructFrom(reference, date));
  }
  set(date, flags) {
    if (flags.timestampIsSet) return date;
    return constructFrom(date, transpose(date, this.context));
  }
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/Parser.js
var Parser = class {
  run(dateString, token, match2, options) {
    const result = this.parse(dateString, token, match2, options);
    if (!result) {
      return null;
    }
    return {
      setter: new ValueSetter(
        result.value,
        this.validate,
        this.set,
        this.priority,
        this.subPriority
      ),
      rest: result.rest
    };
  }
  validate(_utcDate, _value, _options) {
    return true;
  }
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/EraParser.js
var EraParser = class extends Parser {
  priority = 140;
  parse(dateString, token, match2) {
    switch (token) {
      // AD, BC
      case "G":
      case "GG":
      case "GGG":
        return match2.era(dateString, { width: "abbreviated" }) || match2.era(dateString, { width: "narrow" });
      // A, B
      case "GGGGG":
        return match2.era(dateString, { width: "narrow" });
      // Anno Domini, Before Christ
      case "GGGG":
      default:
        return match2.era(dateString, { width: "wide" }) || match2.era(dateString, { width: "abbreviated" }) || match2.era(dateString, { width: "narrow" });
    }
  }
  set(date, flags, value) {
    flags.era = value;
    date.setFullYear(value, 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["R", "u", "t", "T"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/constants.js
var numericPatterns = {
  month: /^(1[0-2]|0?\d)/,
  // 0 to 12
  date: /^(3[0-1]|[0-2]?\d)/,
  // 0 to 31
  dayOfYear: /^(36[0-6]|3[0-5]\d|[0-2]?\d?\d)/,
  // 0 to 366
  week: /^(5[0-3]|[0-4]?\d)/,
  // 0 to 53
  hour23h: /^(2[0-3]|[0-1]?\d)/,
  // 0 to 23
  hour24h: /^(2[0-4]|[0-1]?\d)/,
  // 0 to 24
  hour11h: /^(1[0-1]|0?\d)/,
  // 0 to 11
  hour12h: /^(1[0-2]|0?\d)/,
  // 0 to 12
  minute: /^[0-5]?\d/,
  // 0 to 59
  second: /^[0-5]?\d/,
  // 0 to 59
  singleDigit: /^\d/,
  // 0 to 9
  twoDigits: /^\d{1,2}/,
  // 0 to 99
  threeDigits: /^\d{1,3}/,
  // 0 to 999
  fourDigits: /^\d{1,4}/,
  // 0 to 9999
  anyDigitsSigned: /^-?\d+/,
  singleDigitSigned: /^-?\d/,
  // 0 to 9, -0 to -9
  twoDigitsSigned: /^-?\d{1,2}/,
  // 0 to 99, -0 to -99
  threeDigitsSigned: /^-?\d{1,3}/,
  // 0 to 999, -0 to -999
  fourDigitsSigned: /^-?\d{1,4}/
  // 0 to 9999, -0 to -9999
};
var timezonePatterns = {
  basicOptionalMinutes: /^([+-])(\d{2})(\d{2})?|Z/,
  basic: /^([+-])(\d{2})(\d{2})|Z/,
  basicOptionalSeconds: /^([+-])(\d{2})(\d{2})((\d{2}))?|Z/,
  extended: /^([+-])(\d{2}):(\d{2})|Z/,
  extendedOptionalSeconds: /^([+-])(\d{2}):(\d{2})(:(\d{2}))?|Z/
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/utils.js
function mapValue(parseFnResult, mapFn) {
  if (!parseFnResult) {
    return parseFnResult;
  }
  return {
    value: mapFn(parseFnResult.value),
    rest: parseFnResult.rest
  };
}
function parseNumericPattern(pattern, dateString) {
  const matchResult = dateString.match(pattern);
  if (!matchResult) {
    return null;
  }
  return {
    value: parseInt(matchResult[0], 10),
    rest: dateString.slice(matchResult[0].length)
  };
}
function parseTimezonePattern(pattern, dateString) {
  const matchResult = dateString.match(pattern);
  if (!matchResult) {
    return null;
  }
  if (matchResult[0] === "Z") {
    return {
      value: 0,
      rest: dateString.slice(1)
    };
  }
  const sign = matchResult[1] === "+" ? 1 : -1;
  const hours = matchResult[2] ? parseInt(matchResult[2], 10) : 0;
  const minutes = matchResult[3] ? parseInt(matchResult[3], 10) : 0;
  const seconds = matchResult[5] ? parseInt(matchResult[5], 10) : 0;
  return {
    value: sign * (hours * millisecondsInHour + minutes * millisecondsInMinute + seconds * millisecondsInSecond),
    rest: dateString.slice(matchResult[0].length)
  };
}
function parseAnyDigitsSigned(dateString) {
  return parseNumericPattern(numericPatterns.anyDigitsSigned, dateString);
}
function parseNDigits(n6, dateString) {
  switch (n6) {
    case 1:
      return parseNumericPattern(numericPatterns.singleDigit, dateString);
    case 2:
      return parseNumericPattern(numericPatterns.twoDigits, dateString);
    case 3:
      return parseNumericPattern(numericPatterns.threeDigits, dateString);
    case 4:
      return parseNumericPattern(numericPatterns.fourDigits, dateString);
    default:
      return parseNumericPattern(new RegExp("^\\d{1," + n6 + "}"), dateString);
  }
}
function parseNDigitsSigned(n6, dateString) {
  switch (n6) {
    case 1:
      return parseNumericPattern(numericPatterns.singleDigitSigned, dateString);
    case 2:
      return parseNumericPattern(numericPatterns.twoDigitsSigned, dateString);
    case 3:
      return parseNumericPattern(numericPatterns.threeDigitsSigned, dateString);
    case 4:
      return parseNumericPattern(numericPatterns.fourDigitsSigned, dateString);
    default:
      return parseNumericPattern(new RegExp("^-?\\d{1," + n6 + "}"), dateString);
  }
}
function dayPeriodEnumToHours(dayPeriod) {
  switch (dayPeriod) {
    case "morning":
      return 4;
    case "evening":
      return 17;
    case "pm":
    case "noon":
    case "afternoon":
      return 12;
    case "am":
    case "midnight":
    case "night":
    default:
      return 0;
  }
}
function normalizeTwoDigitYear(twoDigitYear, currentYear) {
  const isCommonEra = currentYear > 0;
  const absCurrentYear = isCommonEra ? currentYear : 1 - currentYear;
  let result;
  if (absCurrentYear <= 50) {
    result = twoDigitYear || 100;
  } else {
    const rangeEnd = absCurrentYear + 50;
    const rangeEndCentury = Math.trunc(rangeEnd / 100) * 100;
    const isPreviousCentury = twoDigitYear >= rangeEnd % 100;
    result = twoDigitYear + rangeEndCentury - (isPreviousCentury ? 100 : 0);
  }
  return isCommonEra ? result : 1 - result;
}
function isLeapYearIndex(year) {
  return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/YearParser.js
var YearParser = class extends Parser {
  priority = 130;
  incompatibleTokens = ["Y", "R", "u", "w", "I", "i", "e", "c", "t", "T"];
  parse(dateString, token, match2) {
    const valueCallback = (year) => ({
      year,
      isTwoDigitYear: token === "yy"
    });
    switch (token) {
      case "y":
        return mapValue(parseNDigits(4, dateString), valueCallback);
      case "yo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "year"
          }),
          valueCallback
        );
      default:
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
    }
  }
  validate(_date, value) {
    return value.isTwoDigitYear || value.year > 0;
  }
  set(date, flags, value) {
    const currentYear = date.getFullYear();
    if (value.isTwoDigitYear) {
      const normalizedTwoDigitYear = normalizeTwoDigitYear(
        value.year,
        currentYear
      );
      date.setFullYear(normalizedTwoDigitYear, 0, 1);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    const year = !("era" in flags) || flags.era === 1 ? value.year : 1 - value.year;
    date.setFullYear(year, 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/LocalWeekYearParser.js
var LocalWeekYearParser = class extends Parser {
  priority = 130;
  parse(dateString, token, match2) {
    const valueCallback = (year) => ({
      year,
      isTwoDigitYear: token === "YY"
    });
    switch (token) {
      case "Y":
        return mapValue(parseNDigits(4, dateString), valueCallback);
      case "Yo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "year"
          }),
          valueCallback
        );
      default:
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
    }
  }
  validate(_date, value) {
    return value.isTwoDigitYear || value.year > 0;
  }
  set(date, flags, value, options) {
    const currentYear = getWeekYear(date, options);
    if (value.isTwoDigitYear) {
      const normalizedTwoDigitYear = normalizeTwoDigitYear(
        value.year,
        currentYear
      );
      date.setFullYear(
        normalizedTwoDigitYear,
        0,
        options.firstWeekContainsDate
      );
      date.setHours(0, 0, 0, 0);
      return startOfWeek(date, options);
    }
    const year = !("era" in flags) || flags.era === 1 ? value.year : 1 - value.year;
    date.setFullYear(year, 0, options.firstWeekContainsDate);
    date.setHours(0, 0, 0, 0);
    return startOfWeek(date, options);
  }
  incompatibleTokens = [
    "y",
    "R",
    "u",
    "Q",
    "q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "i",
    "t",
    "T"
  ];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/ISOWeekYearParser.js
var ISOWeekYearParser = class extends Parser {
  priority = 130;
  parse(dateString, token) {
    if (token === "R") {
      return parseNDigitsSigned(4, dateString);
    }
    return parseNDigitsSigned(token.length, dateString);
  }
  set(date, _flags, value) {
    const firstWeekOfYear = constructFrom(date, 0);
    firstWeekOfYear.setFullYear(value, 0, 4);
    firstWeekOfYear.setHours(0, 0, 0, 0);
    return startOfISOWeek(firstWeekOfYear);
  }
  incompatibleTokens = [
    "G",
    "y",
    "Y",
    "u",
    "Q",
    "q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "e",
    "c",
    "t",
    "T"
  ];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/ExtendedYearParser.js
var ExtendedYearParser = class extends Parser {
  priority = 130;
  parse(dateString, token) {
    if (token === "u") {
      return parseNDigitsSigned(4, dateString);
    }
    return parseNDigitsSigned(token.length, dateString);
  }
  set(date, _flags, value) {
    date.setFullYear(value, 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["G", "y", "Y", "R", "w", "I", "i", "e", "c", "t", "T"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/QuarterParser.js
var QuarterParser = class extends Parser {
  priority = 120;
  parse(dateString, token, match2) {
    switch (token) {
      // 1, 2, 3, 4
      case "Q":
      case "QQ":
        return parseNDigits(token.length, dateString);
      // 1st, 2nd, 3rd, 4th
      case "Qo":
        return match2.ordinalNumber(dateString, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "QQQ":
        return match2.quarter(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.quarter(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "QQQQQ":
        return match2.quarter(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // 1st quarter, 2nd quarter, ...
      case "QQQQ":
      default:
        return match2.quarter(dateString, {
          width: "wide",
          context: "formatting"
        }) || match2.quarter(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.quarter(dateString, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 4;
  }
  set(date, _flags, value) {
    date.setMonth((value - 1) * 3, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/StandAloneQuarterParser.js
var StandAloneQuarterParser = class extends Parser {
  priority = 120;
  parse(dateString, token, match2) {
    switch (token) {
      // 1, 2, 3, 4
      case "q":
      case "qq":
        return parseNDigits(token.length, dateString);
      // 1st, 2nd, 3rd, 4th
      case "qo":
        return match2.ordinalNumber(dateString, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "qqq":
        return match2.quarter(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.quarter(dateString, {
          width: "narrow",
          context: "standalone"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "qqqqq":
        return match2.quarter(dateString, {
          width: "narrow",
          context: "standalone"
        });
      // 1st quarter, 2nd quarter, ...
      case "qqqq":
      default:
        return match2.quarter(dateString, {
          width: "wide",
          context: "standalone"
        }) || match2.quarter(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.quarter(dateString, {
          width: "narrow",
          context: "standalone"
        });
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 4;
  }
  set(date, _flags, value) {
    date.setMonth((value - 1) * 3, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "Q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/MonthParser.js
var MonthParser = class extends Parser {
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "L",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
  priority = 110;
  parse(dateString, token, match2) {
    const valueCallback = (value) => value - 1;
    switch (token) {
      // 1, 2, ..., 12
      case "M":
        return mapValue(
          parseNumericPattern(numericPatterns.month, dateString),
          valueCallback
        );
      // 01, 02, ..., 12
      case "MM":
        return mapValue(parseNDigits(2, dateString), valueCallback);
      // 1st, 2nd, ..., 12th
      case "Mo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "month"
          }),
          valueCallback
        );
      // Jan, Feb, ..., Dec
      case "MMM":
        return match2.month(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.month(dateString, { width: "narrow", context: "formatting" });
      // J, F, ..., D
      case "MMMMM":
        return match2.month(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // January, February, ..., December
      case "MMMM":
      default:
        return match2.month(dateString, { width: "wide", context: "formatting" }) || match2.month(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.month(dateString, { width: "narrow", context: "formatting" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 11;
  }
  set(date, _flags, value) {
    date.setMonth(value, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/StandAloneMonthParser.js
var StandAloneMonthParser = class extends Parser {
  priority = 110;
  parse(dateString, token, match2) {
    const valueCallback = (value) => value - 1;
    switch (token) {
      // 1, 2, ..., 12
      case "L":
        return mapValue(
          parseNumericPattern(numericPatterns.month, dateString),
          valueCallback
        );
      // 01, 02, ..., 12
      case "LL":
        return mapValue(parseNDigits(2, dateString), valueCallback);
      // 1st, 2nd, ..., 12th
      case "Lo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "month"
          }),
          valueCallback
        );
      // Jan, Feb, ..., Dec
      case "LLL":
        return match2.month(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.month(dateString, { width: "narrow", context: "standalone" });
      // J, F, ..., D
      case "LLLLL":
        return match2.month(dateString, {
          width: "narrow",
          context: "standalone"
        });
      // January, February, ..., December
      case "LLLL":
      default:
        return match2.month(dateString, { width: "wide", context: "standalone" }) || match2.month(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.month(dateString, { width: "narrow", context: "standalone" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 11;
  }
  set(date, _flags, value) {
    date.setMonth(value, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "M",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/setWeek.js
function setWeek(date, week, options) {
  const date_ = toDate(date, options?.in);
  const diff = getWeek(date_, options) - week;
  date_.setDate(date_.getDate() - diff * 7);
  return toDate(date_, options?.in);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/LocalWeekParser.js
var LocalWeekParser = class extends Parser {
  priority = 100;
  parse(dateString, token, match2) {
    switch (token) {
      case "w":
        return parseNumericPattern(numericPatterns.week, dateString);
      case "wo":
        return match2.ordinalNumber(dateString, { unit: "week" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 53;
  }
  set(date, _flags, value, options) {
    return startOfWeek(setWeek(date, value, options), options);
  }
  incompatibleTokens = [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "i",
    "t",
    "T"
  ];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/setISOWeek.js
function setISOWeek(date, week, options) {
  const _date = toDate(date, options?.in);
  const diff = getISOWeek(_date, options) - week;
  _date.setDate(_date.getDate() - diff * 7);
  return _date;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/ISOWeekParser.js
var ISOWeekParser = class extends Parser {
  priority = 100;
  parse(dateString, token, match2) {
    switch (token) {
      case "I":
        return parseNumericPattern(numericPatterns.week, dateString);
      case "Io":
        return match2.ordinalNumber(dateString, { unit: "week" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 53;
  }
  set(date, _flags, value) {
    return startOfISOWeek(setISOWeek(date, value));
  }
  incompatibleTokens = [
    "y",
    "Y",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "e",
    "c",
    "t",
    "T"
  ];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/DateParser.js
var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var DAYS_IN_MONTH_LEAP_YEAR = [
  31,
  29,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31
];
var DateParser = class extends Parser {
  priority = 90;
  subPriority = 1;
  parse(dateString, token, match2) {
    switch (token) {
      case "d":
        return parseNumericPattern(numericPatterns.date, dateString);
      case "do":
        return match2.ordinalNumber(dateString, { unit: "date" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(date, value) {
    const year = date.getFullYear();
    const isLeapYear = isLeapYearIndex(year);
    const month = date.getMonth();
    if (isLeapYear) {
      return value >= 1 && value <= DAYS_IN_MONTH_LEAP_YEAR[month];
    } else {
      return value >= 1 && value <= DAYS_IN_MONTH[month];
    }
  }
  set(date, _flags, value) {
    date.setDate(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/DayOfYearParser.js
var DayOfYearParser = class extends Parser {
  priority = 90;
  subpriority = 1;
  parse(dateString, token, match2) {
    switch (token) {
      case "D":
      case "DD":
        return parseNumericPattern(numericPatterns.dayOfYear, dateString);
      case "Do":
        return match2.ordinalNumber(dateString, { unit: "date" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(date, value) {
    const year = date.getFullYear();
    const isLeapYear = isLeapYearIndex(year);
    if (isLeapYear) {
      return value >= 1 && value <= 366;
    } else {
      return value >= 1 && value <= 365;
    }
  }
  set(date, _flags, value) {
    date.setMonth(0, value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "E",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/setDay.js
function setDay(date, day, options) {
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const date_ = toDate(date, options?.in);
  const currentDay = date_.getDay();
  const remainder = day % 7;
  const dayIndex = (remainder + 7) % 7;
  const delta = 7 - weekStartsOn;
  const diff = day < 0 || day > 6 ? day - (currentDay + delta) % 7 : (dayIndex + delta) % 7 - (currentDay + delta) % 7;
  return addDays(date_, diff, options);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/DayParser.js
var DayParser = class extends Parser {
  priority = 90;
  parse(dateString, token, match2) {
    switch (token) {
      // Tue
      case "E":
      case "EE":
      case "EEE":
        return match2.day(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
      // T
      case "EEEEE":
        return match2.day(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "EEEEEE":
        return match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
      // Tuesday
      case "EEEE":
      default:
        return match2.day(dateString, { width: "wide", context: "formatting" }) || match2.day(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 6;
  }
  set(date, _flags, value, options) {
    date = setDay(date, value, options);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["D", "i", "e", "c", "t", "T"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/LocalDayParser.js
var LocalDayParser = class extends Parser {
  priority = 90;
  parse(dateString, token, match2, options) {
    const valueCallback = (value) => {
      const wholeWeekDays = Math.floor((value - 1) / 7) * 7;
      return (value + options.weekStartsOn + 6) % 7 + wholeWeekDays;
    };
    switch (token) {
      // 3
      case "e":
      case "ee":
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
      // 3rd
      case "eo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "day"
          }),
          valueCallback
        );
      // Tue
      case "eee":
        return match2.day(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
      // T
      case "eeeee":
        return match2.day(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "eeeeee":
        return match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
      // Tuesday
      case "eeee":
      default:
        return match2.day(dateString, { width: "wide", context: "formatting" }) || match2.day(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 6;
  }
  set(date, _flags, value, options) {
    date = setDay(date, value, options);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "E",
    "i",
    "c",
    "t",
    "T"
  ];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/StandAloneLocalDayParser.js
var StandAloneLocalDayParser = class extends Parser {
  priority = 90;
  parse(dateString, token, match2, options) {
    const valueCallback = (value) => {
      const wholeWeekDays = Math.floor((value - 1) / 7) * 7;
      return (value + options.weekStartsOn + 6) % 7 + wholeWeekDays;
    };
    switch (token) {
      // 3
      case "c":
      case "cc":
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
      // 3rd
      case "co":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "day"
          }),
          valueCallback
        );
      // Tue
      case "ccc":
        return match2.day(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.day(dateString, { width: "short", context: "standalone" }) || match2.day(dateString, { width: "narrow", context: "standalone" });
      // T
      case "ccccc":
        return match2.day(dateString, {
          width: "narrow",
          context: "standalone"
        });
      // Tu
      case "cccccc":
        return match2.day(dateString, { width: "short", context: "standalone" }) || match2.day(dateString, { width: "narrow", context: "standalone" });
      // Tuesday
      case "cccc":
      default:
        return match2.day(dateString, { width: "wide", context: "standalone" }) || match2.day(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.day(dateString, { width: "short", context: "standalone" }) || match2.day(dateString, { width: "narrow", context: "standalone" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 6;
  }
  set(date, _flags, value, options) {
    date = setDay(date, value, options);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "E",
    "i",
    "e",
    "t",
    "T"
  ];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/setISODay.js
function setISODay(date, day, options) {
  const date_ = toDate(date, options?.in);
  const currentDay = getISODay(date_, options);
  const diff = day - currentDay;
  return addDays(date_, diff, options);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/ISODayParser.js
var ISODayParser = class extends Parser {
  priority = 90;
  parse(dateString, token, match2) {
    const valueCallback = (value) => {
      if (value === 0) {
        return 7;
      }
      return value;
    };
    switch (token) {
      // 2
      case "i":
      case "ii":
        return parseNDigits(token.length, dateString);
      // 2nd
      case "io":
        return match2.ordinalNumber(dateString, { unit: "day" });
      // Tue
      case "iii":
        return mapValue(
          match2.day(dateString, {
            width: "abbreviated",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "short",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "narrow",
            context: "formatting"
          }),
          valueCallback
        );
      // T
      case "iiiii":
        return mapValue(
          match2.day(dateString, {
            width: "narrow",
            context: "formatting"
          }),
          valueCallback
        );
      // Tu
      case "iiiiii":
        return mapValue(
          match2.day(dateString, {
            width: "short",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "narrow",
            context: "formatting"
          }),
          valueCallback
        );
      // Tuesday
      case "iiii":
      default:
        return mapValue(
          match2.day(dateString, {
            width: "wide",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "abbreviated",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "short",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "narrow",
            context: "formatting"
          }),
          valueCallback
        );
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 7;
  }
  set(date, _flags, value) {
    date = setISODay(date, value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "y",
    "Y",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "E",
    "e",
    "c",
    "t",
    "T"
  ];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/AMPMParser.js
var AMPMParser = class extends Parser {
  priority = 80;
  parse(dateString, token, match2) {
    switch (token) {
      case "a":
      case "aa":
      case "aaa":
        return match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaaa":
        return match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return match2.dayPeriod(dateString, {
          width: "wide",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(date, _flags, value) {
    date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["b", "B", "H", "k", "t", "T"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/AMPMMidnightParser.js
var AMPMMidnightParser = class extends Parser {
  priority = 80;
  parse(dateString, token, match2) {
    switch (token) {
      case "b":
      case "bb":
      case "bbb":
        return match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbbb":
        return match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return match2.dayPeriod(dateString, {
          width: "wide",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(date, _flags, value) {
    date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["a", "B", "H", "k", "t", "T"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/DayPeriodParser.js
var DayPeriodParser = class extends Parser {
  priority = 80;
  parse(dateString, token, match2) {
    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBBB":
        return match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return match2.dayPeriod(dateString, {
          width: "wide",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(date, _flags, value) {
    date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["a", "b", "t", "T"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/Hour1to12Parser.js
var Hour1to12Parser = class extends Parser {
  priority = 70;
  parse(dateString, token, match2) {
    switch (token) {
      case "h":
        return parseNumericPattern(numericPatterns.hour12h, dateString);
      case "ho":
        return match2.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 12;
  }
  set(date, _flags, value) {
    const isPM = date.getHours() >= 12;
    if (isPM && value < 12) {
      date.setHours(value + 12, 0, 0, 0);
    } else if (!isPM && value === 12) {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(value, 0, 0, 0);
    }
    return date;
  }
  incompatibleTokens = ["H", "K", "k", "t", "T"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/Hour0to23Parser.js
var Hour0to23Parser = class extends Parser {
  priority = 70;
  parse(dateString, token, match2) {
    switch (token) {
      case "H":
        return parseNumericPattern(numericPatterns.hour23h, dateString);
      case "Ho":
        return match2.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 23;
  }
  set(date, _flags, value) {
    date.setHours(value, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["a", "b", "h", "K", "k", "t", "T"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/Hour0To11Parser.js
var Hour0To11Parser = class extends Parser {
  priority = 70;
  parse(dateString, token, match2) {
    switch (token) {
      case "K":
        return parseNumericPattern(numericPatterns.hour11h, dateString);
      case "Ko":
        return match2.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 11;
  }
  set(date, _flags, value) {
    const isPM = date.getHours() >= 12;
    if (isPM && value < 12) {
      date.setHours(value + 12, 0, 0, 0);
    } else {
      date.setHours(value, 0, 0, 0);
    }
    return date;
  }
  incompatibleTokens = ["h", "H", "k", "t", "T"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/Hour1To24Parser.js
var Hour1To24Parser = class extends Parser {
  priority = 70;
  parse(dateString, token, match2) {
    switch (token) {
      case "k":
        return parseNumericPattern(numericPatterns.hour24h, dateString);
      case "ko":
        return match2.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 24;
  }
  set(date, _flags, value) {
    const hours = value <= 24 ? value % 24 : value;
    date.setHours(hours, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["a", "b", "h", "H", "K", "t", "T"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/MinuteParser.js
var MinuteParser = class extends Parser {
  priority = 60;
  parse(dateString, token, match2) {
    switch (token) {
      case "m":
        return parseNumericPattern(numericPatterns.minute, dateString);
      case "mo":
        return match2.ordinalNumber(dateString, { unit: "minute" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 59;
  }
  set(date, _flags, value) {
    date.setMinutes(value, 0, 0);
    return date;
  }
  incompatibleTokens = ["t", "T"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/SecondParser.js
var SecondParser = class extends Parser {
  priority = 50;
  parse(dateString, token, match2) {
    switch (token) {
      case "s":
        return parseNumericPattern(numericPatterns.second, dateString);
      case "so":
        return match2.ordinalNumber(dateString, { unit: "second" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 59;
  }
  set(date, _flags, value) {
    date.setSeconds(value, 0);
    return date;
  }
  incompatibleTokens = ["t", "T"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/FractionOfSecondParser.js
var FractionOfSecondParser = class extends Parser {
  priority = 30;
  parse(dateString, token) {
    const valueCallback = (value) => Math.trunc(value * Math.pow(10, -token.length + 3));
    return mapValue(parseNDigits(token.length, dateString), valueCallback);
  }
  set(date, _flags, value) {
    date.setMilliseconds(value);
    return date;
  }
  incompatibleTokens = ["t", "T"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/ISOTimezoneWithZParser.js
var ISOTimezoneWithZParser = class extends Parser {
  priority = 10;
  parse(dateString, token) {
    switch (token) {
      case "X":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalMinutes,
          dateString
        );
      case "XX":
        return parseTimezonePattern(timezonePatterns.basic, dateString);
      case "XXXX":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalSeconds,
          dateString
        );
      case "XXXXX":
        return parseTimezonePattern(
          timezonePatterns.extendedOptionalSeconds,
          dateString
        );
      case "XXX":
      default:
        return parseTimezonePattern(timezonePatterns.extended, dateString);
    }
  }
  set(date, flags, value) {
    if (flags.timestampIsSet) return date;
    return constructFrom(
      date,
      date.getTime() - getTimezoneOffsetInMilliseconds(date) - value
    );
  }
  incompatibleTokens = ["t", "T", "x"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/ISOTimezoneParser.js
var ISOTimezoneParser = class extends Parser {
  priority = 10;
  parse(dateString, token) {
    switch (token) {
      case "x":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalMinutes,
          dateString
        );
      case "xx":
        return parseTimezonePattern(timezonePatterns.basic, dateString);
      case "xxxx":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalSeconds,
          dateString
        );
      case "xxxxx":
        return parseTimezonePattern(
          timezonePatterns.extendedOptionalSeconds,
          dateString
        );
      case "xxx":
      default:
        return parseTimezonePattern(timezonePatterns.extended, dateString);
    }
  }
  set(date, flags, value) {
    if (flags.timestampIsSet) return date;
    return constructFrom(
      date,
      date.getTime() - getTimezoneOffsetInMilliseconds(date) - value
    );
  }
  incompatibleTokens = ["t", "T", "X"];
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/TimestampSecondsParser.js
var TimestampSecondsParser = class extends Parser {
  priority = 40;
  parse(dateString) {
    return parseAnyDigitsSigned(dateString);
  }
  set(date, _flags, value) {
    return [constructFrom(date, value * 1e3), { timestampIsSet: true }];
  }
  incompatibleTokens = "*";
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers/TimestampMillisecondsParser.js
var TimestampMillisecondsParser = class extends Parser {
  priority = 20;
  parse(dateString) {
    return parseAnyDigitsSigned(dateString);
  }
  set(date, _flags, value) {
    return [constructFrom(date, value), { timestampIsSet: true }];
  }
  incompatibleTokens = "*";
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse/_lib/parsers.js
var parsers = {
  G: new EraParser(),
  y: new YearParser(),
  Y: new LocalWeekYearParser(),
  R: new ISOWeekYearParser(),
  u: new ExtendedYearParser(),
  Q: new QuarterParser(),
  q: new StandAloneQuarterParser(),
  M: new MonthParser(),
  L: new StandAloneMonthParser(),
  w: new LocalWeekParser(),
  I: new ISOWeekParser(),
  d: new DateParser(),
  D: new DayOfYearParser(),
  E: new DayParser(),
  e: new LocalDayParser(),
  c: new StandAloneLocalDayParser(),
  i: new ISODayParser(),
  a: new AMPMParser(),
  b: new AMPMMidnightParser(),
  B: new DayPeriodParser(),
  h: new Hour1to12Parser(),
  H: new Hour0to23Parser(),
  K: new Hour0To11Parser(),
  k: new Hour1To24Parser(),
  m: new MinuteParser(),
  s: new SecondParser(),
  S: new FractionOfSecondParser(),
  X: new ISOTimezoneWithZParser(),
  x: new ISOTimezoneParser(),
  t: new TimestampSecondsParser(),
  T: new TimestampMillisecondsParser()
};

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse.js
var formattingTokensRegExp2 = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
var longFormattingTokensRegExp2 = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp2 = /^'([^]*?)'?$/;
var doubleQuoteRegExp2 = /''/g;
var notWhitespaceRegExp = /\S/;
var unescapedLatinCharacterRegExp2 = /[a-zA-Z]/;
function parse(dateStr, formatStr, referenceDate, options) {
  const invalidDate = () => constructFrom(options?.in || referenceDate, NaN);
  const defaultOptions2 = getDefaultOptions2();
  const locale = options?.locale ?? defaultOptions2.locale ?? enUS;
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  if (!formatStr)
    return dateStr ? invalidDate() : toDate(referenceDate, options?.in);
  const subFnOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale
  };
  const setters = [new DateTimezoneSetter(options?.in, referenceDate)];
  const tokens = formatStr.match(longFormattingTokensRegExp2).map((substring) => {
    const firstCharacter = substring[0];
    if (firstCharacter in longFormatters) {
      const longFormatter = longFormatters[firstCharacter];
      return longFormatter(substring, locale.formatLong);
    }
    return substring;
  }).join("").match(formattingTokensRegExp2);
  const usedTokens = [];
  for (let token of tokens) {
    if (!options?.useAdditionalWeekYearTokens && isProtectedWeekYearToken(token)) {
      warnOrThrowProtectedError(token, formatStr, dateStr);
    }
    if (!options?.useAdditionalDayOfYearTokens && isProtectedDayOfYearToken(token)) {
      warnOrThrowProtectedError(token, formatStr, dateStr);
    }
    const firstCharacter = token[0];
    const parser = parsers[firstCharacter];
    if (parser) {
      const { incompatibleTokens } = parser;
      if (Array.isArray(incompatibleTokens)) {
        const incompatibleToken = usedTokens.find(
          (usedToken) => incompatibleTokens.includes(usedToken.token) || usedToken.token === firstCharacter
        );
        if (incompatibleToken) {
          throw new RangeError(
            `The format string mustn't contain \`${incompatibleToken.fullToken}\` and \`${token}\` at the same time`
          );
        }
      } else if (parser.incompatibleTokens === "*" && usedTokens.length > 0) {
        throw new RangeError(
          `The format string mustn't contain \`${token}\` and any other token at the same time`
        );
      }
      usedTokens.push({ token: firstCharacter, fullToken: token });
      const parseResult = parser.run(
        dateStr,
        token,
        locale.match,
        subFnOptions
      );
      if (!parseResult) {
        return invalidDate();
      }
      setters.push(parseResult.setter);
      dateStr = parseResult.rest;
    } else {
      if (firstCharacter.match(unescapedLatinCharacterRegExp2)) {
        throw new RangeError(
          "Format string contains an unescaped latin alphabet character `" + firstCharacter + "`"
        );
      }
      if (token === "''") {
        token = "'";
      } else if (firstCharacter === "'") {
        token = cleanEscapedString2(token);
      }
      if (dateStr.indexOf(token) === 0) {
        dateStr = dateStr.slice(token.length);
      } else {
        return invalidDate();
      }
    }
  }
  if (dateStr.length > 0 && notWhitespaceRegExp.test(dateStr)) {
    return invalidDate();
  }
  const uniquePrioritySetters = setters.map((setter) => setter.priority).sort((a3, b3) => b3 - a3).filter((priority, index, array) => array.indexOf(priority) === index).map(
    (priority) => setters.filter((setter) => setter.priority === priority).sort((a3, b3) => b3.subPriority - a3.subPriority)
  ).map((setterArray) => setterArray[0]);
  let date = toDate(referenceDate, options?.in);
  if (isNaN(+date)) return invalidDate();
  const flags = {};
  for (const setter of uniquePrioritySetters) {
    if (!setter.validate(date, subFnOptions)) {
      return invalidDate();
    }
    const result = setter.set(date, flags, subFnOptions);
    if (Array.isArray(result)) {
      date = result[0];
      Object.assign(flags, result[1]);
    } else {
      date = result;
    }
  }
  return date;
}
function cleanEscapedString2(input) {
  return input.match(escapedStringRegExp2)[1].replace(doubleQuoteRegExp2, "'");
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isSameMonth.js
function isSameMonth(laterDate, earlierDate, options) {
  const [laterDate_, earlierDate_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate
  );
  return laterDate_.getFullYear() === earlierDate_.getFullYear() && laterDate_.getMonth() === earlierDate_.getMonth();
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isToday.js
function isToday(date, options) {
  return isSameDay(
    constructFrom(options?.in || date, date),
    constructNow(options?.in || date)
  );
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isWithinInterval.js
function isWithinInterval(date, interval, options) {
  const time = +toDate(date, options?.in);
  const [startTime, endTime] = [
    +toDate(interval.start, options?.in),
    +toDate(interval.end, options?.in)
  ].sort((a3, b3) => a3 - b3);
  return time >= startTime && time <= endTime;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/subDays.js
function subDays(date, amount, options) {
  return addDays(date, -amount, options);
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parseISO.js
function parseISO(argument, options) {
  const invalidDate = () => constructFrom(options?.in, NaN);
  const additionalDigits = options?.additionalDigits ?? 2;
  const dateStrings = splitDateString(argument);
  let date;
  if (dateStrings.date) {
    const parseYearResult = parseYear(dateStrings.date, additionalDigits);
    date = parseDate(parseYearResult.restDateString, parseYearResult.year);
  }
  if (!date || isNaN(+date)) return invalidDate();
  const timestamp = +date;
  let time = 0;
  let offset4;
  if (dateStrings.time) {
    time = parseTime(dateStrings.time);
    if (isNaN(time)) return invalidDate();
  }
  if (dateStrings.timezone) {
    offset4 = parseTimezone(dateStrings.timezone);
    if (isNaN(offset4)) return invalidDate();
  } else {
    const tmpDate = new Date(timestamp + time);
    const result = toDate(0, options?.in);
    result.setFullYear(
      tmpDate.getUTCFullYear(),
      tmpDate.getUTCMonth(),
      tmpDate.getUTCDate()
    );
    result.setHours(
      tmpDate.getUTCHours(),
      tmpDate.getUTCMinutes(),
      tmpDate.getUTCSeconds(),
      tmpDate.getUTCMilliseconds()
    );
    return result;
  }
  return toDate(timestamp + time + offset4, options?.in);
}
var patterns = {
  dateTimeDelimiter: /[T ]/,
  timeZoneDelimiter: /[Z ]/i,
  timezone: /([Z+-].*)$/
};
var dateRegex = /^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/;
var timeRegex = /^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/;
var timezoneRegex = /^([+-])(\d{2})(?::?(\d{2}))?$/;
function splitDateString(dateString) {
  const dateStrings = {};
  const array = dateString.split(patterns.dateTimeDelimiter);
  let timeString;
  if (array.length > 2) {
    return dateStrings;
  }
  if (/:/.test(array[0])) {
    timeString = array[0];
  } else {
    dateStrings.date = array[0];
    timeString = array[1];
    if (patterns.timeZoneDelimiter.test(dateStrings.date)) {
      dateStrings.date = dateString.split(patterns.timeZoneDelimiter)[0];
      timeString = dateString.substr(
        dateStrings.date.length,
        dateString.length
      );
    }
  }
  if (timeString) {
    const token = patterns.timezone.exec(timeString);
    if (token) {
      dateStrings.time = timeString.replace(token[1], "");
      dateStrings.timezone = token[1];
    } else {
      dateStrings.time = timeString;
    }
  }
  return dateStrings;
}
function parseYear(dateString, additionalDigits) {
  const regex = new RegExp(
    "^(?:(\\d{4}|[+-]\\d{" + (4 + additionalDigits) + "})|(\\d{2}|[+-]\\d{" + (2 + additionalDigits) + "})$)"
  );
  const captures = dateString.match(regex);
  if (!captures) return { year: NaN, restDateString: "" };
  const year = captures[1] ? parseInt(captures[1]) : null;
  const century = captures[2] ? parseInt(captures[2]) : null;
  return {
    year: century === null ? year : century * 100,
    restDateString: dateString.slice((captures[1] || captures[2]).length)
  };
}
function parseDate(dateString, year) {
  if (year === null) return /* @__PURE__ */ new Date(NaN);
  const captures = dateString.match(dateRegex);
  if (!captures) return /* @__PURE__ */ new Date(NaN);
  const isWeekDate = !!captures[4];
  const dayOfYear = parseDateUnit(captures[1]);
  const month = parseDateUnit(captures[2]) - 1;
  const day = parseDateUnit(captures[3]);
  const week = parseDateUnit(captures[4]);
  const dayOfWeek = parseDateUnit(captures[5]) - 1;
  if (isWeekDate) {
    if (!validateWeekDate(year, week, dayOfWeek)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    return dayOfISOWeekYear(year, week, dayOfWeek);
  } else {
    const date = /* @__PURE__ */ new Date(0);
    if (!validateDate(year, month, day) || !validateDayOfYearDate(year, dayOfYear)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    date.setUTCFullYear(year, month, Math.max(dayOfYear, day));
    return date;
  }
}
function parseDateUnit(value) {
  return value ? parseInt(value) : 1;
}
function parseTime(timeString) {
  const captures = timeString.match(timeRegex);
  if (!captures) return NaN;
  const hours = parseTimeUnit(captures[1]);
  const minutes = parseTimeUnit(captures[2]);
  const seconds = parseTimeUnit(captures[3]);
  if (!validateTime(hours, minutes, seconds)) {
    return NaN;
  }
  return hours * millisecondsInHour + minutes * millisecondsInMinute + seconds * 1e3;
}
function parseTimeUnit(value) {
  return value && parseFloat(value.replace(",", ".")) || 0;
}
function parseTimezone(timezoneString) {
  if (timezoneString === "Z") return 0;
  const captures = timezoneString.match(timezoneRegex);
  if (!captures) return 0;
  const sign = captures[1] === "+" ? -1 : 1;
  const hours = parseInt(captures[2]);
  const minutes = captures[3] && parseInt(captures[3]) || 0;
  if (!validateTimezone(hours, minutes)) {
    return NaN;
  }
  return sign * (hours * millisecondsInHour + minutes * millisecondsInMinute);
}
function dayOfISOWeekYear(isoWeekYear, week, day) {
  const date = /* @__PURE__ */ new Date(0);
  date.setUTCFullYear(isoWeekYear, 0, 4);
  const fourthOfJanuaryDay = date.getUTCDay() || 7;
  const diff = (week - 1) * 7 + day + 1 - fourthOfJanuaryDay;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}
var daysInMonths = [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function isLeapYearIndex2(year) {
  return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0;
}
function validateDate(year, month, date) {
  return month >= 0 && month <= 11 && date >= 1 && date <= (daysInMonths[month] || (isLeapYearIndex2(year) ? 29 : 28));
}
function validateDayOfYearDate(year, dayOfYear) {
  return dayOfYear >= 1 && dayOfYear <= (isLeapYearIndex2(year) ? 366 : 365);
}
function validateWeekDate(_year, week, day) {
  return week >= 1 && week <= 53 && day >= 0 && day <= 6;
}
function validateTime(hours, minutes, seconds) {
  if (hours === 24) {
    return minutes === 0 && seconds === 0;
  }
  return seconds >= 0 && seconds < 60 && minutes >= 0 && minutes < 60 && hours >= 0 && hours < 25;
}
function validateTimezone(_hours, minutes) {
  return minutes >= 0 && minutes <= 59;
}

// node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/subMonths.js
function subMonths(date, amount, options) {
  return addMonths(date, -amount, options);
}

// src/components/ui/animation-controller.ts
var AnimationController = class {
  constructor(target, duration = 200) {
    this.currentAnimation = null;
    this.isAnimating = false;
    this.onMotionChange = (e7) => {
      this.prefersReducedMotion = e7.matches;
    };
    this.target = target;
    this.duration = duration;
    this.mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.prefersReducedMotion = this.mediaQuery.matches;
    this.mediaQuery.addEventListener("change", this.onMotionChange);
  }
  /**
   * Run a slide or fade transition based on direction and motion preference.
   * Skips animation entirely if already animating (rapid navigation).
   */
  async transition(direction) {
    if (this.isAnimating) return;
    if (this.currentAnimation) {
      this.currentAnimation.cancel();
      this.currentAnimation = null;
    }
    this.isAnimating = true;
    try {
      if (this.prefersReducedMotion) {
        await this.fade();
      } else {
        await this.slide(direction);
      }
    } finally {
      this.isAnimating = false;
    }
  }
  /**
   * Returns whether an animation is currently in progress.
   */
  getIsAnimating() {
    return this.isAnimating;
  }
  /**
   * Cancel any in-progress animation and clean up resources.
   */
  destroy() {
    if (this.currentAnimation) {
      this.currentAnimation.cancel();
      this.currentAnimation = null;
    }
    this.mediaQuery.removeEventListener("change", this.onMotionChange);
    this.isAnimating = false;
  }
  async slide(direction) {
    const offset4 = direction === "left" ? "-100%" : "100%";
    this.currentAnimation = this.target.animate(
      [
        { transform: `translateX(${offset4})`, opacity: 0 },
        { transform: "translateX(0)", opacity: 1 }
      ],
      {
        duration: this.duration,
        easing: "ease-out",
        fill: "forwards"
      }
    );
    try {
      await this.currentAnimation.finished;
    } catch {
    }
    this.currentAnimation = null;
  }
  async fade() {
    this.currentAnimation = this.target.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      {
        duration: 150,
        easing: "ease-in-out",
        fill: "forwards"
      }
    );
    try {
      await this.currentAnimation.finished;
    } catch {
    }
    this.currentAnimation = null;
  }
};

// src/components/ui/date-utils.ts
function getCalendarDays(month, weekStartsOn) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}
function getMonthYearLabel(month, locale) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric"
  }).format(month);
}
function intlFirstDayToDateFns(intlFirstDay) {
  return intlFirstDay === 7 ? 0 : intlFirstDay;
}
function getISOWeekNumber(date) {
  return getISOWeek(date);
}
function getMonthWeeks(month, weekStartsOn) {
  const allDays = getCalendarDays(month, weekStartsOn);
  const seen = /* @__PURE__ */ new Map();
  for (let i8 = 0; i8 < allDays.length; i8 += 7) {
    const row = allDays.slice(i8, i8 + 7);
    if (row.length < 7) break;
    const thursday = row.find((d3) => d3.getDay() === 4) ?? row[0];
    const weekKey = startOfISOWeek(thursday).getTime();
    if (!seen.has(weekKey)) {
      seen.set(weekKey, {
        weekNumber: getISOWeekNumber(thursday),
        startDate: row[0],
        endDate: row[6],
        days: row
      });
    }
  }
  return Array.from(seen.values()).sort(
    (a3, b3) => a3.startDate.getTime() - b3.startDate.getTime()
  );
}

// src/components/ui/gesture-handler.ts
var GestureHandler = class {
  constructor(element, onSwipe, threshold = 50, ratio = 1.5) {
    this.startX = 0;
    this.startY = 0;
    this.pointerId = null;
    this.onPointerDown = (e7) => {
      if (this.pointerId !== null) return;
      this.pointerId = e7.pointerId;
      this.startX = e7.clientX;
      this.startY = e7.clientY;
    };
    this.onPointerUp = (e7) => {
      if (e7.pointerId !== this.pointerId) return;
      const dx = e7.clientX - this.startX;
      const dy = e7.clientY - this.startY;
      if (Math.abs(dx) > this.threshold && Math.abs(dx) > Math.abs(dy) * this.ratio) {
        this.onSwipe(dx > 0 ? "right" : "left");
      }
      this.pointerId = null;
    };
    this.onPointerCancel = (e7) => {
      if (e7.pointerId !== this.pointerId) return;
      this.pointerId = null;
    };
    this.element = element;
    this.onSwipe = onSwipe;
    this.threshold = threshold;
    this.ratio = ratio;
  }
  /**
   * Attach pointer event listeners and set touch-action: pan-y
   * to allow vertical scroll while capturing horizontal swipe.
   */
  attach() {
    this.element.style.touchAction = "pan-y";
    this.element.addEventListener("pointerdown", this.onPointerDown);
    this.element.addEventListener("pointerup", this.onPointerUp);
    this.element.addEventListener("pointercancel", this.onPointerCancel);
  }
  /**
   * Remove all pointer event listeners and reset touch-action.
   */
  detach() {
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    this.element.removeEventListener("pointerup", this.onPointerUp);
    this.element.removeEventListener("pointercancel", this.onPointerCancel);
    this.element.style.touchAction = "";
  }
  /**
   * Alias for detach() for semantic clarity.
   */
  destroy() {
    this.detach();
  }
};

// src/components/ui/intl-utils.ts
function getFirstDayOfWeek(locale) {
  try {
    const loc = new Intl.Locale(locale);
    const weekInfo = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (weekInfo?.firstDay != null) {
      return weekInfo.firstDay;
    }
  } catch {
  }
  const sundayLocales = ["en-US", "he-IL", "ja-JP", "ko-KR", "zh-TW"];
  const lang = locale || "en-US";
  for (const sundayLocale of sundayLocales) {
    const [langPart, regionPart] = sundayLocale.split("-");
    if (lang.startsWith(langPart) && lang.includes(regionPart)) {
      return 7;
    }
  }
  return 1;
}
function getWeekdayNames(locale, firstDayOfWeek) {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const refSunday = new Date(2026, 0, 4);
  const days = [];
  for (let i8 = 0; i8 < 7; i8++) {
    const day = new Date(refSunday);
    day.setDate(refSunday.getDate() + i8);
    days.push(formatter.format(day));
  }
  const startIndex = firstDayOfWeek === 7 ? 0 : firstDayOfWeek;
  return [...days.slice(startIndex), ...days.slice(0, startIndex)];
}
function getWeekdayLongNames(locale, firstDayOfWeek) {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "long" });
  const refSunday = new Date(2026, 0, 4);
  const days = [];
  for (let i8 = 0; i8 < 7; i8++) {
    const day = new Date(refSunday);
    day.setDate(refSunday.getDate() + i8);
    days.push(formatter.format(day));
  }
  const startIndex = firstDayOfWeek === 7 ? 0 : firstDayOfWeek;
  return [...days.slice(startIndex), ...days.slice(0, startIndex)];
}

// src/components/ui/keyboard-nav.ts
var KeyboardNavigationManager = class {
  constructor(columns = 7) {
    this.cells = [];
    this.focusedIndex = 0;
    this.columns = columns;
  }
  /**
   * Update the list of focusable cells.
   * Clamps focusedIndex to valid range and updates tabindexes.
   */
  setCells(cells) {
    this.cells = cells;
    if (this.cells.length > 0) {
      this.focusedIndex = Math.max(0, Math.min(this.focusedIndex, this.cells.length - 1));
    } else {
      this.focusedIndex = 0;
    }
    this.updateTabindexes();
  }
  /**
   * Set the focused cell index.
   * Clamps to valid range and updates tabindexes.
   */
  setFocusedIndex(index) {
    if (this.cells.length === 0) return;
    this.focusedIndex = Math.max(0, Math.min(index, this.cells.length - 1));
    this.updateTabindexes();
  }
  /**
   * Returns the current focused cell index.
   */
  getFocusedIndex() {
    return this.focusedIndex;
  }
  /**
   * Update the column count at runtime.
   * Allows switching between 7-column (month grid) and 4-column
   * (decade/century grid) layouts without recreating the manager.
   */
  setColumns(columns) {
    this.columns = columns;
  }
  /**
   * Returns the current column count.
   */
  getColumns() {
    return this.columns;
  }
  /**
   * Move focus in the given direction.
   *
   * Returns the new focused index, or -1 if the movement would
   * cross the grid boundary (signals month navigation to caller).
   */
  moveFocus(direction) {
    if (this.cells.length === 0) return -1;
    let newIndex;
    switch (direction) {
      case "left":
        newIndex = this.focusedIndex - 1;
        break;
      case "right":
        newIndex = this.focusedIndex + 1;
        break;
      case "up":
        newIndex = this.focusedIndex - this.columns;
        break;
      case "down":
        newIndex = this.focusedIndex + this.columns;
        break;
      case "home": {
        const rowStart = Math.floor(this.focusedIndex / this.columns) * this.columns;
        newIndex = rowStart;
        break;
      }
      case "end": {
        const rowStart = Math.floor(this.focusedIndex / this.columns) * this.columns;
        newIndex = Math.min(rowStart + this.columns - 1, this.cells.length - 1);
        break;
      }
    }
    if (newIndex < 0 || newIndex >= this.cells.length) {
      return -1;
    }
    this.focusedIndex = newIndex;
    this.updateTabindexes();
    this.cells[this.focusedIndex].focus();
    return this.focusedIndex;
  }
  /**
   * Focus the current cell. Useful after month navigation
   * when cells have been replaced in the DOM.
   */
  focusCurrent() {
    if (this.cells.length > 0 && this.cells[this.focusedIndex]) {
      this.cells[this.focusedIndex].focus();
    }
  }
  /**
   * Set tabindex="0" on the focused cell, tabindex="-1" on all others.
   */
  updateTabindexes() {
    for (let i8 = 0; i8 < this.cells.length; i8++) {
      this.cells[i8].tabIndex = i8 === this.focusedIndex ? 0 : -1;
    }
  }
};

// src/components/ui/calendar.ts
function formatDateLabel(date, locale) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}
var Calendar = class extends TailwindElement {
  constructor() {
    super(...arguments);
    this.value = "";
    this.locale = "";
    this.minDate = "";
    this.maxDate = "";
    this.disabledDates = [];
    this.firstDayOfWeekOverride = "";
    this.currentMonth = /* @__PURE__ */ new Date();
    this.selectedDate = null;
    this.currentView = "month";
    this.liveAnnouncement = "";
    /**
     * Parsed date constraints derived from minDate, maxDate, and disabledDates properties.
     */
    this.parsedConstraints = {
      minDate: null,
      maxDate: null,
      disabledDates: []
    };
    /**
     * Keyboard navigation manager for roving tabindex (imperative, not reactive).
     */
    this.navigationManager = null;
    /**
     * Track previous view for detecting view changes in updated().
     */
    this.previousView = "month";
    this.displayMonth = "";
    this.hideNavigation = false;
    this.showWeekNumbers = false;
    this.showConstraintTooltips = false;
    this.renderDay = null;
    /**
     * GestureHandler for swipe navigation on touch devices.
     */
    this.gestureHandler = null;
    /**
     * AnimationController for slide/fade month transitions.
     */
    this.animationController = null;
    /**
     * Track direction of last navigation for triggering animation after render.
     */
    this.lastNavigationDirection = null;
  }
  static {
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: block;
        container-type: inline-size;
      }

      .calendar {
        width: var(--ui-calendar-width, 100%);
        max-width: 380px;
      }

      .calendar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
      }

      .calendar-header h2 {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
      }

      .nav-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border: none;
        background: none;
        cursor: pointer;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        color: var(--ui-calendar-nav-color, currentColor);
      }

      .nav-button:hover {
        background-color: var(--ui-calendar-hover-bg);
      }

      .nav-button:focus-visible {
        outline: 2px solid var(--ui-calendar-focus-ring, var(--color-ring));
        outline-offset: 2px;
      }

      .nav-button svg {
        width: 1rem;
        height: 1rem;
      }

      .view-heading {
        font-size: 0.875rem;
        font-weight: 600;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        color: inherit;
      }

      .view-heading:hover {
        background-color: var(--ui-calendar-hover-bg);
      }

      .view-heading:focus-visible {
        outline: 2px solid var(--ui-calendar-focus-ring, var(--color-ring));
        outline-offset: 2px;
      }

      .view-heading.top-level {
        cursor: default;
      }

      .view-heading.top-level:hover {
        background: none;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      .calendar-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: var(--ui-calendar-gap, 0.125rem);
        text-align: center;
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: var(--ui-calendar-gap, 0.125rem);
      }

      .weekday-header {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--ui-calendar-weekday-color);
        padding: 0.5rem 0;
      }

      .date-button {
        width: var(--ui-calendar-day-size, 2.5rem);
        height: var(--ui-calendar-day-size, 2.5rem);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        border: 2px solid transparent;
        background: none;
        cursor: pointer;
        font-size: 0.875rem;
        margin: 0 auto;
        color: inherit;
      }

      .date-button:hover {
        background-color: var(--ui-calendar-hover-bg);
      }

      .date-button.outside-month {
        opacity: var(--ui-calendar-outside-opacity, 0.4);
      }

      .date-button.today {
        border: 2px solid var(--ui-calendar-today-border, var(--color-primary));
        font-weight: 600;
      }

      .date-button[aria-selected="true"] {
        background-color: var(--ui-calendar-selected-bg, var(--color-primary));
        color: var(--ui-calendar-selected-text, white);
      }

      .date-button[aria-selected="true"]:hover {
        background-color: var(--ui-calendar-selected-bg, var(--color-primary));
        filter: brightness(0.9);
      }

      .date-button:focus-visible {
        outline: 2px solid var(--ui-calendar-focus-ring, var(--color-ring));
        outline-offset: 2px;
      }

      .date-button[aria-disabled="true"] {
        opacity: var(--ui-calendar-disabled-opacity, 0.5);
        cursor: not-allowed;
        pointer-events: none;
      }

      .year-grid,
      .decade-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.25rem;
        padding: 0.5rem;
      }

      .year-cell,
      .decade-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.75rem 0.5rem;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        border: 2px solid transparent;
        background: none;
        cursor: pointer;
        font-size: 0.875rem;
        color: inherit;
      }

      .year-cell:hover,
      .decade-cell:hover {
        background-color: var(--ui-calendar-hover-bg);
      }

      .year-cell:focus-visible,
      .decade-cell:focus-visible {
        outline: 2px solid var(--ui-calendar-focus-ring, var(--color-ring));
        outline-offset: 2px;
      }

      .year-cell.outside,
      .decade-cell.outside {
        opacity: var(--ui-calendar-outside-opacity, 0.4);
      }

      .year-cell.current {
        border-color: var(--ui-calendar-today-border, var(--color-primary));
        font-weight: 600;
      }

      .decade-cell.current {
        border-color: var(--ui-calendar-today-border, var(--color-primary));
        font-weight: 600;
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      .help-button {
        font-size: 0.75rem;
        color: var(--ui-calendar-weekday-color);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        text-decoration: underline;
      }

      .help-dialog {
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid var(--ui-calendar-border);
        max-width: 320px;
      }

      .help-dialog::backdrop {
        background: rgba(0, 0, 0, 0.3);
      }

      .shortcut-list {
        list-style: none;
        padding: 0;
        margin: 0.5rem 0;
        font-size: 0.875rem;
      }

      .shortcut-list li {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
      }

      .shortcut-list kbd {
        font-family: monospace;
        background: var(--ui-calendar-hover-bg);
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
      }

      /* Constraint tooltip for disabled dates */
      .date-button[data-tooltip],
      .date-button-wrapper[data-tooltip] {
        position: relative;
      }

      .date-button[data-tooltip]:hover::after,
      .date-button-wrapper[data-tooltip]:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: calc(100% + 4px);
        left: 50%;
        transform: translateX(-50%);
        padding: 0.25rem 0.5rem;
        background: var(--ui-calendar-tooltip-bg);
        color: var(--ui-calendar-tooltip-text);
        font-size: 0.6875rem;
        line-height: 1.25;
        border-radius: 0.25rem;
        white-space: nowrap;
        z-index: 10;
        pointer-events: none;
      }

      .month-grid {
        overflow: hidden;
      }

      .calendar-weekdays-with-weeks {
        display: grid;
        grid-template-columns: auto repeat(7, 1fr);
        gap: var(--ui-calendar-gap, 0.125rem);
        text-align: center;
      }

      .calendar-grid-with-weeks {
        display: grid;
        grid-template-columns: auto repeat(7, 1fr);
        gap: var(--ui-calendar-gap, 0.125rem);
      }

      .week-number {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        color: var(--ui-calendar-weekday-color);
        cursor: pointer;
        padding: 0.25rem;
        border: none;
        background: none;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        width: 2rem;
      }

      .week-number:hover {
        background-color: var(--ui-calendar-hover-bg);
      }

      .week-number:focus-visible {
        outline: 2px solid var(--ui-calendar-focus-ring, var(--color-ring));
        outline-offset: 2px;
      }

      .week-number-header {
        width: 2rem;
      }

      .date-button-wrapper {
        width: var(--ui-calendar-day-size, 2.5rem);
        height: var(--ui-calendar-day-size, 2.5rem);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        border: 2px solid transparent;
        background: none;
        cursor: pointer;
        font-size: 0.875rem;
        margin: 0 auto;
        color: inherit;
      }

      .date-button-wrapper:hover {
        background-color: var(--ui-calendar-hover-bg);
      }

      .date-button-wrapper.outside-month {
        opacity: var(--ui-calendar-outside-opacity, 0.4);
      }

      .date-button-wrapper.today {
        border: 2px solid var(--ui-calendar-today-border, var(--color-primary));
        font-weight: 600;
      }

      .date-button-wrapper[aria-selected="true"] {
        background-color: var(--ui-calendar-selected-bg, var(--color-primary));
        color: var(--ui-calendar-selected-text, white);
      }

      .date-button-wrapper[aria-selected="true"]:hover {
        background-color: var(--ui-calendar-selected-bg, var(--color-primary));
        filter: brightness(0.9);
      }

      .date-button-wrapper:focus-visible {
        outline: 2px solid var(--ui-calendar-focus-ring, var(--color-ring));
        outline-offset: 2px;
      }

      .date-button-wrapper[aria-disabled="true"] {
        opacity: var(--ui-calendar-disabled-opacity, 0.5);
        cursor: not-allowed;
        pointer-events: none;
      }

      /* Container query: compact (<280px) */
      @container (max-width: 279px) {
        .calendar {
          --ui-calendar-day-size: 1.75rem;
        }
        .calendar-header h2,
        .view-heading {
          font-size: 0.75rem;
        }
        .weekday-header {
          font-size: 0.625rem;
          padding: 0.25rem 0;
        }
        .date-button, .date-button-wrapper {
          font-size: 0.75rem;
        }
        .nav-button {
          width: 1.5rem;
          height: 1.5rem;
        }
        .nav-button svg {
          width: 0.75rem;
          height: 0.75rem;
        }
        .year-cell, .decade-cell {
          padding: 0.5rem 0.25rem;
          font-size: 0.75rem;
        }
        .week-number {
          font-size: 0.625rem;
          width: 1.5rem;
        }
        .help-button {
          font-size: 0.625rem;
        }
      }

      /* Container query: spacious (>380px) */
      @container (min-width: 381px) {
        .calendar {
          --ui-calendar-day-size: 3rem;
        }
        .date-button, .date-button-wrapper {
          font-size: 1rem;
        }
        .weekday-header {
          font-size: 0.875rem;
        }
        .calendar-header h2,
        .view-heading {
          font-size: 1rem;
        }
        .year-cell, .decade-cell {
          padding: 1rem 0.75rem;
          font-size: 1rem;
        }
      }
    `
    ];
  }
  /**
   * Initialize keyboard navigation manager after first render.
   */
  firstUpdated() {
    if (o5) return;
    this.navigationManager = new KeyboardNavigationManager(7);
    requestAnimationFrame(() => this.setupCells());
    this.updateComplete.then(() => {
      const grid = this.renderRoot.querySelector(".month-grid");
      if (grid) {
        this.gestureHandler = new GestureHandler(grid, (direction) => {
          if (direction === "left") this.navigateNextMonth();
          else this.navigatePrevMonth();
        });
        this.gestureHandler.attach();
        this.animationController = new AnimationController(grid);
      }
    });
  }
  /**
   * Clean up gesture handler and animation controller on disconnect.
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    this.gestureHandler?.detach();
    this.animationController?.destroy();
  }
  /**
   * Query current-month date buttons and initialize roving tabindex.
   * Sets initial focus to today (if visible) or first day of month.
   */
  setupCells() {
    if (!this.navigationManager) return;
    const buttons = Array.from(
      this.renderRoot.querySelectorAll(
        ".date-button:not(.outside-month), .date-button-wrapper:not(.outside-month)"
      )
    );
    this.navigationManager.setCells(buttons);
    const todayIndex = buttons.findIndex(
      (btn) => btn.classList.contains("today")
    );
    if (todayIndex >= 0) {
      this.navigationManager.setFocusedIndex(todayIndex);
    } else {
      this.navigationManager.setFocusedIndex(0);
    }
  }
  /**
   * Initialize keyboard navigation for the current view.
   * Sets column count and cell references for year/decade grids.
   */
  setupViewCells() {
    if (!this.navigationManager) return;
    if (this.currentView === "month") {
      this.navigationManager.setColumns(7);
      this.setupCells();
    } else if (this.currentView === "year") {
      this.navigationManager.setColumns(4);
      const buttons = Array.from(
        this.renderRoot.querySelectorAll(".year-cell")
      );
      this.navigationManager.setCells(buttons);
      this.navigationManager.setFocusedIndex(0);
    } else if (this.currentView === "decade") {
      this.navigationManager.setColumns(4);
      const buttons = Array.from(
        this.renderRoot.querySelectorAll(".decade-cell")
      );
      this.navigationManager.setCells(buttons);
      this.navigationManager.setFocusedIndex(0);
    }
  }
  /**
   * Switch to the parent view level.
   * month -> year, year -> decade, decade stays.
   */
  drillUp() {
    if (this.currentView === "month") {
      this.currentView = "year";
    } else if (this.currentView === "year") {
      this.currentView = "decade";
    }
  }
  /**
   * Switch to a specific child view level.
   * Initializes keyboard navigation after the view renders.
   */
  drillDown(view) {
    this.currentView = view;
    this.updateComplete.then(() => {
      requestAnimationFrame(() => this.setupViewCells());
    });
  }
  /**
   * Handle click on the view heading button to drill up.
   */
  handleViewHeadingClick() {
    this.drillUp();
  }
  /**
   * Handle keyboard events on the view heading button.
   */
  handleViewHeadingKeydown(e7) {
    if (e7.key === "Enter" || e7.key === " ") {
      e7.preventDefault();
      this.drillUp();
    }
  }
  /**
   * Handle keyboard navigation on the calendar grid.
   */
  handleKeydown(e7) {
    if (!this.navigationManager) return;
    if (e7.key === "Escape") {
      if (this.currentView === "decade") {
        e7.preventDefault();
        this.drillDown("year");
      } else if (this.currentView === "year") {
        e7.preventDefault();
        this.drillDown("month");
      }
      return;
    }
    if (this.currentView === "year" && (e7.key === "Enter" || e7.key === " ")) {
      e7.preventDefault();
      const idx = this.navigationManager.getFocusedIndex();
      const buttons = Array.from(
        this.renderRoot.querySelectorAll(".year-cell")
      );
      if (buttons[idx]) {
        buttons[idx].click();
      }
      return;
    }
    if (this.currentView === "decade" && (e7.key === "Enter" || e7.key === " ")) {
      e7.preventDefault();
      const idx = this.navigationManager.getFocusedIndex();
      const buttons = Array.from(
        this.renderRoot.querySelectorAll(".decade-cell")
      );
      if (buttons[idx]) {
        buttons[idx].click();
      }
      return;
    }
    const keyMap = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      Home: "home",
      End: "end"
    };
    const direction = keyMap[e7.key];
    if (direction) {
      e7.preventDefault();
      const result = this.navigationManager.moveFocus(direction);
      if (result === -1 && this.currentView === "month") {
        if (direction === "left" || direction === "up") {
          this.navigatePrevMonth();
          this.updateComplete.then(() => {
            requestAnimationFrame(() => {
              this.setupCells();
              const buttons = Array.from(
                this.renderRoot.querySelectorAll(
                  ".date-button:not(.outside-month), .date-button-wrapper:not(.outside-month)"
                )
              );
              if (buttons.length > 0) {
                this.navigationManager?.setFocusedIndex(buttons.length - 1);
                this.navigationManager?.focusCurrent();
              }
            });
          });
        } else {
          this.navigateNextMonth();
          this.updateComplete.then(() => {
            requestAnimationFrame(() => {
              this.setupCells();
              this.navigationManager?.focusCurrent();
            });
          });
        }
      }
      return;
    }
    if (this.currentView === "month") {
      if (e7.key === "PageUp") {
        e7.preventDefault();
        const currentIdx = this.navigationManager.getFocusedIndex();
        this.navigatePrevMonth();
        this.updateComplete.then(() => {
          requestAnimationFrame(() => {
            this.setupCells();
            this.navigationManager?.setFocusedIndex(currentIdx);
            this.navigationManager?.focusCurrent();
          });
        });
        return;
      }
      if (e7.key === "PageDown") {
        e7.preventDefault();
        const currentIdx = this.navigationManager.getFocusedIndex();
        this.navigateNextMonth();
        this.updateComplete.then(() => {
          requestAnimationFrame(() => {
            this.setupCells();
            this.navigationManager?.setFocusedIndex(currentIdx);
            this.navigationManager?.focusCurrent();
          });
        });
        return;
      }
    }
    if (this.currentView === "month" && (e7.key === "Enter" || e7.key === " ")) {
      e7.preventDefault();
      const idx = this.navigationManager.getFocusedIndex();
      const buttons = Array.from(
        this.renderRoot.querySelectorAll(".date-button:not(.outside-month)")
      );
      if (buttons[idx]) {
        buttons[idx].click();
      }
      return;
    }
  }
  /**
   * Sync view state, value property, and date constraints when reactive properties change.
   */
  updated(changedProperties) {
    super.updated(changedProperties);
    if (this.currentView !== this.previousView) {
      this.previousView = this.currentView;
      if (!o5) {
        this.updateComplete.then(() => {
          requestAnimationFrame(() => this.setupViewCells());
        });
      }
    }
    if (changedProperties.has("currentMonth")) {
      if (!o5 && this.currentView === "month") {
        requestAnimationFrame(() => this.setupCells());
      }
      if (!o5 && this.lastNavigationDirection && this.animationController) {
        const direction = this.lastNavigationDirection;
        this.lastNavigationDirection = null;
        this.animationController.transition(direction);
      }
    }
    if (changedProperties.has("displayMonth") && this.displayMonth) {
      const raw = this.displayMonth.trim();
      if (raw.length === 7) {
        this.currentMonth = parseISO(`${raw}-01`);
      } else if (raw.length >= 10) {
        this.currentMonth = parseISO(raw);
      }
    }
    if (changedProperties.has("value") && this.value) {
      this.selectedDate = parseISO(this.value);
    }
    if (changedProperties.has("minDate")) {
      this.parsedConstraints = {
        ...this.parsedConstraints,
        minDate: this.minDate ? startOfDay(parseISO(this.minDate)) : null
      };
    }
    if (changedProperties.has("maxDate")) {
      this.parsedConstraints = {
        ...this.parsedConstraints,
        maxDate: this.maxDate ? startOfDay(parseISO(this.maxDate)) : null
      };
    }
    if (changedProperties.has("disabledDates")) {
      this.parsedConstraints = {
        ...this.parsedConstraints,
        disabledDates: this.disabledDates.map((d3) => startOfDay(parseISO(d3)))
      };
    }
  }
  /**
   * Check whether a date is disabled based on min/max/disabled constraints.
   *
   * @param date - The date to check
   * @returns Object with disabled flag and human-readable reason
   */
  isDateDisabled(date) {
    const normalized = startOfDay(date);
    const { minDate, maxDate, disabledDates } = this.parsedConstraints;
    if (minDate && isBefore(normalized, minDate)) {
      return { disabled: true, reason: "Before minimum date" };
    }
    if (maxDate && isAfter(normalized, maxDate)) {
      return { disabled: true, reason: "After maximum date" };
    }
    if (disabledDates.some((d3) => isSameDay(d3, normalized))) {
      return { disabled: true, reason: "Unavailable" };
    }
    return { disabled: false, reason: "" };
  }
  /**
   * Resolved locale, falling back to navigator.language or 'en-US'.
   */
  get effectiveLocale() {
    return this.locale || (o5 ? "en-US" : navigator.language);
  }
  /**
   * First day of week in Intl format (1=Mon ... 7=Sun).
   * Uses the override property if valid (1-7), otherwise detects from locale.
   */
  get firstDayOfWeek() {
    if (this.firstDayOfWeekOverride) {
      const parsed = parseInt(this.firstDayOfWeekOverride, 10);
      if (parsed >= 1 && parsed <= 7) {
        return parsed;
      }
    }
    return getFirstDayOfWeek(this.effectiveLocale);
  }
  /**
   * First day of week in date-fns format (0=Sun ... 6=Sat).
   */
  get weekStartsOn() {
    return intlFirstDayToDateFns(this.firstDayOfWeek);
  }
  /**
   * Navigate to the previous month.
   */
  navigatePrevMonth() {
    this.lastNavigationDirection = "right";
    this.currentMonth = subMonths(this.currentMonth, 1);
    this.emitMonthChange();
    this.announceMonthChange();
  }
  /**
   * Navigate to the next month.
   */
  navigateNextMonth() {
    this.lastNavigationDirection = "left";
    this.currentMonth = addMonths(this.currentMonth, 1);
    this.emitMonthChange();
    this.announceMonthChange();
  }
  /**
   * Navigate year view to previous decade.
   */
  navigatePrevDecade() {
    const newDate = new Date(this.currentMonth);
    newDate.setFullYear(getYear(this.currentMonth) - 10);
    this.currentMonth = newDate;
  }
  /**
   * Navigate year view to next decade.
   */
  navigateNextDecade() {
    const newDate = new Date(this.currentMonth);
    newDate.setFullYear(getYear(this.currentMonth) + 10);
    this.currentMonth = newDate;
  }
  /**
   * Navigate decade view to previous century.
   */
  navigatePrevCentury() {
    const newDate = new Date(this.currentMonth);
    newDate.setFullYear(getYear(this.currentMonth) - 100);
    this.currentMonth = newDate;
  }
  /**
   * Navigate decade view to next century.
   */
  navigateNextCentury() {
    const newDate = new Date(this.currentMonth);
    newDate.setFullYear(getYear(this.currentMonth) + 100);
    this.currentMonth = newDate;
  }
  /**
   * Select a year from the year view and drill down to month view.
   */
  selectYear(year) {
    const newDate = new Date(this.currentMonth);
    newDate.setFullYear(year);
    newDate.setMonth(0);
    newDate.setDate(1);
    this.currentMonth = newDate;
    this.drillDown("month");
  }
  /**
   * Select a decade from the decade view and drill down to year view.
   */
  selectDecade(decade) {
    const newDate = new Date(this.currentMonth);
    newDate.setFullYear(decade);
    newDate.setMonth(0);
    newDate.setDate(1);
    this.currentMonth = newDate;
    this.drillDown("year");
  }
  /**
   * Emit month-change event with the current year and month.
   */
  emitMonthChange() {
    dispatchCustomEvent(this, "month-change", {
      year: getYear(this.currentMonth),
      month: getMonth(this.currentMonth)
    });
  }
  /**
   * Announce the current month to screen readers via the aria-live region.
   */
  announceMonthChange() {
    this.liveAnnouncement = "Now showing " + getMonthYearLabel(this.currentMonth, this.effectiveLocale);
  }
  /**
   * Open the keyboard shortcuts help dialog.
   */
  openHelpDialog() {
    this.showHelp = true;
    if (!o5) {
      this.updateComplete.then(() => {
        this.helpDialog?.showModal();
      });
    }
  }
  /**
   * Close the keyboard shortcuts help dialog.
   */
  closeHelpDialog() {
    this.showHelp = false;
    if (!o5) {
      this.helpDialog?.close();
    }
  }
  /**
   * Handle date selection via click.
   * Skips outside-month dates and disabled dates, sets selectedDate, updates value, and emits change.
   */
  handleDateSelect(date) {
    if (!isSameMonth(date, this.currentMonth)) {
      return;
    }
    const { disabled } = this.isDateDisabled(date);
    if (disabled) {
      return;
    }
    this.selectedDate = date;
    this.value = format(date, "yyyy-MM-dd");
    dispatchCustomEvent(this, "change", {
      date,
      isoString: this.value
    });
    this.liveAnnouncement = `Selected ${formatDateLabel(date, this.effectiveLocale)}`;
  }
  /**
   * Render the main calendar dispatching to view-specific renderers.
   */
  render() {
    switch (this.currentView) {
      case "year":
        return this.renderYearView();
      case "decade":
        return this.renderDecadeView();
      default:
        return this.renderMonthView();
    }
  }
  /**
   * Render the standard month view with 7-column day grid.
   */
  renderMonthView() {
    const weekdays = getWeekdayNames(this.effectiveLocale, this.firstDayOfWeek);
    const weekdayLongNames = getWeekdayLongNames(
      this.effectiveLocale,
      this.firstDayOfWeek
    );
    const days = getCalendarDays(this.currentMonth, this.weekStartsOn);
    const monthLabel = getMonthYearLabel(
      this.currentMonth,
      this.effectiveLocale
    );
    const weeks = this.showWeekNumbers ? getMonthWeeks(this.currentMonth, this.weekStartsOn) : null;
    const weekdaysClass = this.showWeekNumbers ? "calendar-weekdays-with-weeks" : "calendar-weekdays";
    const gridClass = this.showWeekNumbers ? "calendar-grid-with-weeks" : "calendar-grid";
    return b2`
      <div class="calendar">
        ${this.hideNavigation ? A : b2`
        <div class="calendar-header">
          <button
            class="nav-button"
            @click="${this.navigatePrevMonth}"
            aria-label="Previous month, ${getMonthYearLabel(subMonths(this.currentMonth, 1), this.effectiveLocale)}"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            class="view-heading"
            @click="${this.handleViewHeadingClick}"
            @keydown="${this.handleViewHeadingKeydown}"
            aria-label="Switch to year view"
          >
            ${monthLabel}
          </button>
          <h2 id="month-heading" class="sr-only" aria-live="polite">${monthLabel}</h2>
          <button
            class="nav-button"
            @click="${this.navigateNextMonth}"
            aria-label="Next month, ${getMonthYearLabel(addMonths(this.currentMonth, 1), this.effectiveLocale)}"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        `}
        <div class="month-grid">
          <div class="${weekdaysClass}" role="row">
            ${this.showWeekNumbers ? b2`<div class="weekday-header week-number-header" role="columnheader" aria-label="Week number"></div>` : A}
            ${weekdays.map(
      (name, i8) => b2`
                <div
                  class="weekday-header"
                  role="columnheader"
                  aria-label="${weekdayLongNames[i8]}"
                >
                  ${name}
                </div>
              `
    )}
          </div>
          <div
            class="${gridClass}"
            role="grid"
            aria-labelledby="month-heading"
            @keydown="${this.handleKeydown}"
          >
            ${this.showWeekNumbers && weeks ? this.renderWeeksWithNumbers(weeks) : this.renderFlatDays(days)}
          </div>
        </div>
        <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          ${this.liveAnnouncement}
        </div>
        <div style="text-align: center; padding: 0.25rem;">
          <button
            class="help-button"
            @click="${this.openHelpDialog}"
            aria-label="Keyboard shortcuts"
          >
            ? Keyboard shortcuts
          </button>
        </div>
        <dialog class="help-dialog" @close="${() => {
      this.showHelp = false;
    }}">
          <h3 style="margin: 0 0 0.5rem; font-size: 1rem; font-weight: 600;">Keyboard Shortcuts</h3>
          <ul class="shortcut-list">
            <li><span>Previous day</span> <kbd>&#8592;</kbd></li>
            <li><span>Next day</span> <kbd>&#8594;</kbd></li>
            <li><span>Previous week</span> <kbd>&#8593;</kbd></li>
            <li><span>Next week</span> <kbd>&#8595;</kbd></li>
            <li><span>Previous month</span> <kbd>PageUp</kbd></li>
            <li><span>Next month</span> <kbd>PageDown</kbd></li>
            <li><span>Start of month</span> <kbd>Home</kbd></li>
            <li><span>End of month</span> <kbd>End</kbd></li>
            <li><span>Select date</span> <kbd>Enter</kbd></li>
            <li><span>Year view</span> <kbd>Click heading</kbd></li>
            <li><span>Back to month</span> <kbd>Escape</kbd></li>
          </ul>
          <button
            @click="${this.closeHelpDialog}"
            style="margin-top: 0.5rem; padding: 0.375rem 0.75rem; border: 1px solid var(--ui-calendar-border); border-radius: 0.25rem; background: none; cursor: pointer;"
          >
            Close
          </button>
        </dialog>
      </div>
    `;
  }
  /**
   * Render days as a flat grid (no week numbers).
   */
  renderFlatDays(days) {
    const tracker = { found: false };
    return days.map((day) => this.renderDayCell(day, tracker));
  }
  /**
   * Render weeks with week number buttons prepended to each row.
   */
  renderWeeksWithNumbers(weeks) {
    const tracker = { found: false };
    return weeks.map((week) => {
      const weekNumberButton = b2`
        <button
          class="week-number"
          tabindex="-1"
          aria-label="Week ${week.weekNumber}, select entire week"
          @click="${() => this.handleWeekSelect(week.days)}"
        >
          ${week.weekNumber}
        </button>
      `;
      const dayCells = week.days.map((day) => this.renderDayCell(day, tracker));
      return b2`${weekNumberButton}${dayCells}`;
    });
  }
  /**
   * Render a single day cell, supporting the renderDay callback.
   */
  renderDayCell(day, tracker) {
    const outsideMonth = !isSameMonth(day, this.currentMonth);
    const todayFlag = isToday(day);
    const selected = this.selectedDate !== null && isSameDay(day, this.selectedDate);
    const constraint = this.isDateDisabled(day);
    const isDisabled = outsideMonth || constraint.disabled;
    const label = constraint.disabled ? `${formatDateLabel(day, this.effectiveLocale)}, ${constraint.reason}` : formatDateLabel(day, this.effectiveLocale);
    let initialTabindex = -1;
    if (!outsideMonth && !tracker.found) {
      tracker.found = true;
      initialTabindex = 0;
    }
    if (this.renderDay) {
      const dayCellState = {
        date: day,
        isToday: todayFlag,
        isSelected: selected,
        isDisabled,
        isOutsideMonth: outsideMonth,
        isInRange: !isDisabled,
        weekNumber: getISOWeekNumber(day),
        formattedDate: format(day, "yyyy-MM-dd")
      };
      return b2`
        <div
          class="date-button-wrapper ${outsideMonth ? "outside-month" : ""} ${todayFlag ? "today" : ""}"
          tabindex="${initialTabindex}"
          role="gridcell"
          aria-label="${label}"
          aria-current="${todayFlag ? "date" : A}"
          aria-selected="${selected ? "true" : "false"}"
          aria-disabled="${isDisabled ? "true" : "false"}"
          data-tooltip="${this.showConstraintTooltips && constraint.disabled && constraint.reason ? constraint.reason : A}"
          @click="${() => this.handleDateSelect(day)}"
        >
          ${this.renderDay(dayCellState)}
        </div>
      `;
    }
    return b2`
      <button
        class="date-button ${outsideMonth ? "outside-month" : ""} ${todayFlag ? "today" : ""}"
        tabindex="${initialTabindex}"
        aria-label="${label}"
        aria-current="${todayFlag ? "date" : A}"
        aria-selected="${selected ? "true" : "false"}"
        aria-disabled="${isDisabled ? "true" : "false"}"
        data-tooltip="${this.showConstraintTooltips && constraint.disabled && constraint.reason ? constraint.reason : A}"
        @click="${() => this.handleDateSelect(day)}"
      >
        ${day.getDate()}
      </button>
    `;
  }
  /**
   * Handle week number click — select all current-month, non-disabled days in the week.
   */
  handleWeekSelect(weekDays) {
    const filteredDays = weekDays.filter((day) => {
      if (!isSameMonth(day, this.currentMonth)) return false;
      const { disabled } = this.isDateDisabled(day);
      return !disabled;
    });
    const thursday = weekDays.find((d3) => d3.getDay() === 4) ?? weekDays[0];
    const weekNumber = getISOWeekNumber(thursday);
    dispatchCustomEvent(this, "week-select", {
      weekNumber,
      dates: filteredDays,
      isoStrings: filteredDays.map((d3) => format(d3, "yyyy-MM-dd"))
    });
    this.liveAnnouncement = `Selected week ${weekNumber}`;
  }
  /**
   * Render the year view showing a 4x3 grid of 12 years (decade).
   */
  renderYearView() {
    const currentYear = getYear(this.currentMonth);
    const decadeStart = Math.floor(currentYear / 10) * 10;
    const years = [];
    for (let y3 = decadeStart - 1; y3 <= decadeStart + 10; y3++) {
      years.push(y3);
    }
    const headingLabel = `${decadeStart}\u2013${decadeStart + 9}`;
    return b2`
      <div class="calendar">
        ${this.hideNavigation ? A : b2`
        <div class="calendar-header">
          <button
            class="nav-button"
            @click="${this.navigatePrevDecade}"
            aria-label="Previous decade"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            class="view-heading"
            @click="${this.handleViewHeadingClick}"
            @keydown="${this.handleViewHeadingKeydown}"
            aria-label="Switch to decade view"
          >
            ${headingLabel}
          </button>
          <button
            class="nav-button"
            @click="${this.navigateNextDecade}"
            aria-label="Next decade"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        `}
        <div
          class="year-grid"
          role="grid"
          aria-label="${headingLabel}"
          @keydown="${this.handleKeydown}"
        >
          ${years.map((year) => {
      const outside = year < decadeStart || year > decadeStart + 9;
      const current = year === currentYear;
      return b2`
              <button
                class="year-cell ${outside ? "outside" : ""} ${current ? "current" : ""}"
                tabindex="-1"
                aria-label="${year}"
                @click="${() => this.selectYear(year)}"
              >
                ${year}
              </button>
            `;
    })}
        </div>
        <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          ${this.liveAnnouncement}
        </div>
      </div>
    `;
  }
  /**
   * Render the decade view showing a 4x3 grid of 12 decades (century).
   */
  renderDecadeView() {
    const currentYear = getYear(this.currentMonth);
    const centuryStart = Math.floor(currentYear / 100) * 100;
    const decades = [];
    for (let d3 = centuryStart - 10; d3 <= centuryStart + 100; d3 += 10) {
      decades.push(d3);
    }
    const headingLabel = `${centuryStart}\u2013${centuryStart + 99}`;
    const currentDecade = Math.floor(currentYear / 10) * 10;
    return b2`
      <div class="calendar">
        ${this.hideNavigation ? A : b2`
        <div class="calendar-header">
          <button
            class="nav-button"
            @click="${this.navigatePrevCentury}"
            aria-label="Previous century"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span class="view-heading top-level" aria-label="${headingLabel}">
            ${headingLabel}
          </span>
          <button
            class="nav-button"
            @click="${this.navigateNextCentury}"
            aria-label="Next century"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        `}
        <div
          class="decade-grid"
          role="grid"
          aria-label="${headingLabel}"
          @keydown="${this.handleKeydown}"
        >
          ${decades.map((decade) => {
      const outside = decade < centuryStart || decade >= centuryStart + 100;
      const current = decade === currentDecade;
      return b2`
              <button
                class="decade-cell ${outside ? "outside" : ""} ${current ? "current" : ""}"
                tabindex="-1"
                aria-label="${decade} to ${decade + 9}"
                @click="${() => this.selectDecade(decade)}"
              >
                ${decade}
              </button>
            `;
    })}
        </div>
        <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          ${this.liveAnnouncement}
        </div>
      </div>
    `;
  }
};
__decorateClass([
  n4({ type: String })
], Calendar.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], Calendar.prototype, "locale", 2);
__decorateClass([
  n4({ type: String, attribute: "min-date" })
], Calendar.prototype, "minDate", 2);
__decorateClass([
  n4({ type: String, attribute: "max-date" })
], Calendar.prototype, "maxDate", 2);
__decorateClass([
  n4({
    attribute: "disabled-dates",
    converter: {
      fromAttribute: (value) => value ? value.split(",").map((s5) => s5.trim()).filter(Boolean) : []
    }
  })
], Calendar.prototype, "disabledDates", 2);
__decorateClass([
  n4({ type: String, attribute: "first-day-of-week" })
], Calendar.prototype, "firstDayOfWeekOverride", 2);
__decorateClass([
  r5()
], Calendar.prototype, "currentMonth", 2);
__decorateClass([
  r5()
], Calendar.prototype, "selectedDate", 2);
__decorateClass([
  r5()
], Calendar.prototype, "currentView", 2);
__decorateClass([
  r5()
], Calendar.prototype, "liveAnnouncement", 2);
__decorateClass([
  e5(".help-dialog")
], Calendar.prototype, "helpDialog", 2);
__decorateClass([
  n4({ type: String, attribute: "display-month" })
], Calendar.prototype, "displayMonth", 2);
__decorateClass([
  n4({ type: Boolean, attribute: "hide-navigation" })
], Calendar.prototype, "hideNavigation", 2);
__decorateClass([
  n4({ type: Boolean, attribute: "show-week-numbers" })
], Calendar.prototype, "showWeekNumbers", 2);
__decorateClass([
  n4({ type: Boolean, attribute: "show-constraint-tooltips" })
], Calendar.prototype, "showConstraintTooltips", 2);
__decorateClass([
  n4({ attribute: false })
], Calendar.prototype, "renderDay", 2);
if (!customElements.get("lui-calendar")) {
  customElements.define("lui-calendar", Calendar);
}

// src/components/ui/calendar-multi.ts
var CalendarMulti = class extends TailwindElement {
  constructor() {
    super(...arguments);
    this.months = 2;
    this.value = "";
    this.locale = "";
    this.minDate = "";
    this.maxDate = "";
    this.disabledDates = [];
    this.firstDayOfWeekOverride = "";
    this.showWeekNumbers = false;
    this.currentMonth = /* @__PURE__ */ new Date();
  }
  static {
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: block;
        container-type: inline-size;
      }

      .multi-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
      }

      .multi-heading {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
      }

      .multi-wrapper {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .multi-wrapper > * {
        min-width: 240px;
        flex: 1 1 280px;
      }

      .nav-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border: none;
        background: none;
        cursor: pointer;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        color: var(--ui-calendar-nav-color, currentColor);
      }

      .nav-button:hover {
        background-color: var(--ui-calendar-hover-bg);
      }

      .nav-button:focus-visible {
        outline: 2px solid var(--ui-calendar-focus-ring, var(--color-ring));
        outline-offset: 2px;
      }

      .nav-button svg {
        width: 1rem;
        height: 1rem;
      }

      /* Container query: vertical stacking for narrow containers */
      @container (max-width: 599px) {
        .multi-wrapper {
          flex-direction: column;
        }
      }

      /* Container query: wider gap for spacious containers */
      @container (min-width: 800px) {
        .multi-wrapper {
          gap: 1.5rem;
        }
      }
    `
    ];
  }
  /**
   * Clamped month count (2-3).
   */
  get monthCount() {
    return Math.max(2, Math.min(3, this.months));
  }
  /**
   * Navigate to the previous month.
   */
  navigatePrev() {
    this.currentMonth = subMonths(this.currentMonth, 1);
    dispatchCustomEvent(this, "month-change", {
      year: getYear(this.currentMonth),
      month: getMonth(this.currentMonth)
    });
  }
  /**
   * Navigate to the next month.
   */
  navigateNext() {
    this.currentMonth = addMonths(this.currentMonth, 1);
    dispatchCustomEvent(this, "month-change", {
      year: getYear(this.currentMonth),
      month: getMonth(this.currentMonth)
    });
  }
  /**
   * Resolved locale, falling back to navigator.language or 'en-US'.
   */
  get effectiveLocale() {
    return this.locale || (o5 ? "en-US" : navigator.language);
  }
  /**
   * Compute the range heading showing first and last month with en-dash.
   * Examples: "January - February 2026" or "January - March 2026"
   * If months span years: "December 2025 - February 2026"
   */
  get rangeHeading() {
    const firstMonth = this.currentMonth;
    const lastMonth = addMonths(this.currentMonth, this.monthCount - 1);
    const firstYear = getYear(firstMonth);
    const lastYear = getYear(lastMonth);
    const monthFormatter = new Intl.DateTimeFormat(this.effectiveLocale, {
      month: "long"
    });
    const firstName = monthFormatter.format(firstMonth);
    const lastName = monthFormatter.format(lastMonth);
    if (firstYear === lastYear) {
      return `${firstName} \u2013 ${lastName} ${lastYear}`;
    }
    return `${firstName} ${firstYear} \u2013 ${lastName} ${lastYear}`;
  }
  /**
   * Handle date selection events from child calendars.
   * Re-dispatches the event from this component.
   */
  handleDateSelect(e7) {
    const detail = e7.detail;
    this.value = detail?.isoString ?? "";
    dispatchCustomEvent(this, "change", detail);
  }
  /**
   * Handle week selection events from child calendars.
   * Re-dispatches the event from this component.
   */
  handleWeekSelect(e7) {
    const detail = e7.detail;
    dispatchCustomEvent(this, "week-select", detail);
  }
  /**
   * Generate the display-month ISO string for a given month offset.
   */
  getDisplayMonth(offset4) {
    const month = addMonths(this.currentMonth, offset4);
    return format(month, "yyyy-MM-dd");
  }
  render() {
    const months = Array.from({ length: this.monthCount }, (_2, i8) => i8);
    return b2`
      <div>
        <div class="multi-header">
          <button
            class="nav-button"
            @click="${this.navigatePrev}"
            aria-label="Previous month"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 class="multi-heading">${this.rangeHeading}</h2>
          <button
            class="nav-button"
            @click="${this.navigateNext}"
            aria-label="Next month"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <div class="multi-wrapper">
          ${months.map(
      (offset4) => b2`
              <lui-calendar
                display-month="${this.getDisplayMonth(offset4)}"
                hide-navigation
                value="${this.value}"
                locale="${this.locale}"
                min-date="${this.minDate}"
                max-date="${this.maxDate}"
                .disabledDates="${this.disabledDates}"
                first-day-of-week="${this.firstDayOfWeekOverride}"
                ?show-week-numbers="${this.showWeekNumbers}"
                @ui-change="${this.handleDateSelect}"
                @ui-week-select="${this.handleWeekSelect}"
              ></lui-calendar>
            `
    )}
        </div>
      </div>
    `;
  }
};
__decorateClass([
  n4({ type: Number })
], CalendarMulti.prototype, "months", 2);
__decorateClass([
  n4({ type: String })
], CalendarMulti.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], CalendarMulti.prototype, "locale", 2);
__decorateClass([
  n4({ type: String, attribute: "min-date" })
], CalendarMulti.prototype, "minDate", 2);
__decorateClass([
  n4({ type: String, attribute: "max-date" })
], CalendarMulti.prototype, "maxDate", 2);
__decorateClass([
  n4({ type: Array, attribute: false })
], CalendarMulti.prototype, "disabledDates", 2);
__decorateClass([
  n4({ type: String, attribute: "first-day-of-week" })
], CalendarMulti.prototype, "firstDayOfWeekOverride", 2);
__decorateClass([
  n4({ type: Boolean, attribute: "show-week-numbers" })
], CalendarMulti.prototype, "showWeekNumbers", 2);
__decorateClass([
  r5()
], CalendarMulti.prototype, "currentMonth", 2);
if (!customElements.get("lui-calendar-multi")) {
  customElements.define("lui-calendar-multi", CalendarMulti);
}

// src/components/ui/natural-language.ts
var NL_PHRASES = {
  today: () => startOfDay(/* @__PURE__ */ new Date()),
  tomorrow: () => addDays(startOfDay(/* @__PURE__ */ new Date()), 1),
  yesterday: () => addDays(startOfDay(/* @__PURE__ */ new Date()), -1),
  "next week": () => startOfWeek(addWeeks(/* @__PURE__ */ new Date(), 1), { weekStartsOn: 1 })
};
function normalizeInput(input) {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}
function parseNaturalLanguage(input) {
  const normalized = normalizeInput(input);
  if (!normalized) return null;
  const resolver = NL_PHRASES[normalized];
  return resolver ? resolver() : null;
}

// src/components/ui/date-input-parser.ts
var ISO_FORMATS = ["yyyy-MM-dd"];
var US_ORDERED_FORMATS = [
  // Slash US
  "MM/dd/yyyy",
  "M/d/yyyy",
  // Slash EU
  "dd/MM/yyyy",
  "d/M/yyyy",
  // Dash
  "MM-dd-yyyy",
  "dd-MM-yyyy",
  // Dot
  "MM.dd.yyyy",
  "dd.MM.yyyy"
];
var EU_ORDERED_FORMATS = [
  // Slash EU
  "dd/MM/yyyy",
  "d/M/yyyy",
  // Slash US
  "MM/dd/yyyy",
  "M/d/yyyy",
  // Dash
  "dd-MM-yyyy",
  "MM-dd-yyyy",
  // Dot
  "dd.MM.yyyy",
  "MM.dd.yyyy"
];
var US_ORDER_LOCALES = ["en-US", "en-CA"];
function isUSOrderLocale(locale) {
  if (!locale) return true;
  return US_ORDER_LOCALES.some(
    (us) => locale === us || locale.startsWith(us + "-")
  );
}
function parseDateInput(input, locale) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const nlResult = parseNaturalLanguage(trimmed);
  if (nlResult) return nlResult;
  const referenceDate = /* @__PURE__ */ new Date();
  const localeFormats = isUSOrderLocale(locale) ? US_ORDERED_FORMATS : EU_ORDERED_FORMATS;
  const formats = [...ISO_FORMATS, ...localeFormats];
  for (const fmt of formats) {
    const result = parse(trimmed, fmt, referenceDate);
    if (isValid(result)) {
      return result;
    }
  }
  return null;
}
function formatDateForDisplay(date, locale, options) {
  const effectiveLocale = locale || "en-US";
  const effectiveOptions = options ?? {
    year: "numeric",
    month: "long",
    day: "numeric"
  };
  return new Intl.DateTimeFormat(effectiveLocale, effectiveOptions).format(date);
}
function getPlaceholderText(locale) {
  return isUSOrderLocale(locale) ? "MM/DD/YYYY" : "DD/MM/YYYY";
}

// src/components/ui/preset-types.ts
var DEFAULT_PRESETS = [
  { label: "Today", resolve: () => startOfDay(/* @__PURE__ */ new Date()) },
  { label: "Tomorrow", resolve: () => addDays(startOfDay(/* @__PURE__ */ new Date()), 1) },
  { label: "Next Week", resolve: () => startOfWeek(addWeeks(/* @__PURE__ */ new Date(), 1), { weekStartsOn: 1 }) }
];

// src/components/ui/date-picker.ts
var DatePicker = class extends TailwindElement {
  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------
  constructor() {
    super();
    /**
     * ElementInternals for form participation.
     * Null during SSR since attachInternals() is not available.
     */
    this.internals = null;
    /**
     * Unique ID for the input element, used for label association.
     */
    this.inputId = `lui-date-picker-${Math.random().toString(36).substr(2, 9)}`;
    /**
     * Reference to the trigger element for focus restoration after popup close.
     * Used by Plan 04 for focus management.
     */
    this.triggerElement = null;
    this.value = "";
    this.name = "";
    this.locale = "";
    this.placeholder = "";
    this.helperText = "";
    this.minDate = "";
    this.maxDate = "";
    this.required = false;
    this.disabled = false;
    this.inline = false;
    this.error = "";
    this.label = "";
    this.presets = false;
    this.format = null;
    this.open = false;
    this.displayValue = "";
    this.inputValue = "";
    this.isEditing = false;
    this.touched = false;
    this.internalError = "";
    // ---------------------------------------------------------------------------
    // SVG Icons
    // ---------------------------------------------------------------------------
    this.calendarIcon = w`
    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
          stroke="currentColor" stroke-width="2" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
  `;
    this.clearIcon = w`
    <circle cx="12" cy="12" r="10"
            stroke="currentColor" stroke-width="2" fill="none"/>
    <line x1="15" y1="9" x2="9" y2="15"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="9" y1="9" x2="15" y2="15"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  `;
    // ---------------------------------------------------------------------------
    // Click-outside detection
    // ---------------------------------------------------------------------------
    /**
     * Handle document clicks for closing popup when clicking outside.
     * Uses composedPath() to work correctly with Shadow DOM boundaries.
     */
    this.handleDocumentClick = (e7) => {
      if (this.open && !e7.composedPath().includes(this)) {
        this.closePopup();
      }
    };
    if (!o5) {
      this.internals = this.attachInternals();
    }
  }
  static {
    /**
     * Enable form association for this custom element.
     */
    this.formAssociated = true;
  }
  static {
    // ---------------------------------------------------------------------------
    // Styles
    // ---------------------------------------------------------------------------
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: inline-block;
        width: 100%;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      .date-picker-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        position: relative;
      }

      .date-picker-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--ui-date-picker-label-text);
      }

      .required-indicator {
        color: var(--ui-date-picker-error, var(--ui-input-text-error));
        margin-left: 0.125rem;
      }

      .input-container {
        display: flex;
        align-items: center;
        border-radius: var(--ui-date-picker-radius, var(--ui-input-radius));
        border-width: var(--ui-date-picker-border-width, var(--ui-input-border-width));
        border-style: solid;
        border-color: var(--ui-date-picker-border, var(--ui-input-border));
        background-color: var(--ui-date-picker-bg, var(--ui-input-bg));
        transition:
          border-color 150ms,
          box-shadow 150ms;
      }

      .input-container:focus-within {
        border-color: var(--ui-date-picker-border-focus, var(--ui-input-border-focus));
      }

      .input-container.container-error {
        border-color: var(--ui-date-picker-error, var(--ui-input-border-error));
      }

      .input-container.container-disabled {
        background-color: var(--ui-date-picker-bg-disabled, var(--ui-input-bg-disabled));
        border-color: var(--ui-date-picker-border-disabled, var(--ui-input-border-disabled));
        cursor: not-allowed;
      }

      input {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        color: var(--ui-date-picker-text, var(--ui-input-text));
        outline: none;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
      }

      input::placeholder {
        color: var(--ui-date-picker-placeholder, var(--ui-input-placeholder));
      }

      input:disabled {
        color: var(--ui-date-picker-text-disabled, var(--ui-input-text-disabled));
        cursor: not-allowed;
      }

      .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        margin-right: 0.25rem;
        border: none;
        background: transparent;
        color: var(--ui-date-picker-action-text);
        cursor: pointer;
        border-radius: 0.25rem;
        transition:
          color 150ms,
          background-color 150ms;
      }

      .action-button:hover {
        color: var(--ui-date-picker-text, var(--ui-input-text));
        background-color: var(--ui-date-picker-hover-bg);
      }

      .action-button:focus-visible {
        outline: 2px solid var(--ui-date-picker-ring);
        outline-offset: 1px;
      }

      .action-icon {
        width: 1.25em;
        height: 1.25em;
      }

      .helper-text {
        font-size: 0.75rem;
        color: var(--ui-date-picker-helper-text);
      }

      .error-text {
        font-size: 0.75rem;
        color: var(--ui-date-picker-error, var(--ui-input-text-error));
      }

      .popup {
        position: fixed;
        inset: auto;
        margin: 0;
        z-index: var(--ui-date-picker-z-index);
        background-color: var(--ui-date-picker-popup-bg);
        border: 1px solid var(--ui-date-picker-popup-border);
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      }

      .preset-buttons {
        display: flex;
        gap: 0.25rem;
        padding: 0.5rem;
        border-bottom: 1px solid var(--ui-date-picker-popup-border);
      }

      .preset-button {
        flex: 1;
        padding: 0.375rem 0.5rem;
        font-size: 0.75rem;
        border: 1px solid var(--ui-date-picker-preset-border);
        border-radius: 0.25rem;
        background: var(--ui-date-picker-preset-bg);
        color: var(--ui-date-picker-preset-text);
        cursor: pointer;
        transition: background-color 150ms, border-color 150ms;
        white-space: nowrap;
      }

      .preset-button:hover:not(:disabled) {
        background: var(--ui-date-picker-preset-bg-hover);
        border-color: var(--ui-date-picker-preset-border-hover);
      }

      .preset-button:focus-visible {
        outline: 2px solid var(--ui-date-picker-ring);
        outline-offset: 1px;
      }

      .preset-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Inline mode */
      :host([inline]) {
        width: auto;
        display: inline-block;
      }

      .inline-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

    `
    ];
  }
  // ---------------------------------------------------------------------------
  // Computed getters
  // ---------------------------------------------------------------------------
  /**
   * Resolved locale, falling back to navigator.language or 'en-US'.
   */
  get effectiveLocale() {
    return this.locale || (o5 ? "en-US" : navigator.language);
  }
  /**
   * Effective placeholder text, using custom or locale-aware default.
   */
  get effectivePlaceholder() {
    return this.placeholder || getPlaceholderText(this.effectiveLocale);
  }
  /**
   * Whether the component is in an error state.
   */
  get hasError() {
    return !!(this.error || this.touched && this.internalError);
  }
  /**
   * The current error message to display.
   */
  get errorMessage() {
    return this.error || this.internalError;
  }
  /**
   * Resolved preset array based on the presets property value.
   */
  get effectivePresets() {
    if (this.presets === true) return DEFAULT_PRESETS;
    if (Array.isArray(this.presets)) return this.presets;
    return [];
  }
  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  /**
   * React to property changes: sync displayValue and form value when value changes.
   */
  updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has("value")) {
      if (this.value) {
        const date = parseISO(this.value);
        this.displayValue = formatDateForDisplay(
          date,
          this.effectiveLocale,
          this.format ?? void 0
        );
        this.updateFormValue();
      } else {
        this.displayValue = "";
        this.updateFormValue();
      }
      this.validate();
    }
  }
  connectedCallback() {
    super.connectedCallback();
    if (!o5 && !this.inline) {
      document.addEventListener("click", this.handleDocumentClick);
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (!o5 && !this.inline) {
      document.removeEventListener("click", this.handleDocumentClick);
    }
  }
  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  /**
   * Handle input focus: switch to editing mode.
   */
  handleInputFocus() {
    this.isEditing = true;
    this.inputValue = this.displayValue;
  }
  /**
   * Handle input blur: parse typed text and validate.
   * Sets internalError for display and syncs ElementInternals validity.
   */
  handleInputBlur() {
    this.isEditing = false;
    this.touched = true;
    const trimmed = this.inputValue.trim();
    if (trimmed) {
      const parsed = parseDateInput(trimmed, this.effectiveLocale);
      if (parsed) {
        const isoString = format(parsed, "yyyy-MM-dd");
        if (this.minDate) {
          const min2 = startOfDay(parseISO(this.minDate));
          if (isBefore(startOfDay(parsed), min2)) {
            this.internalError = `Date must be on or after ${this.minDate}`;
            this.internals?.setValidity(
              { rangeUnderflow: true },
              this.internalError,
              this.inputEl
            );
            return;
          }
        }
        if (this.maxDate) {
          const max2 = startOfDay(parseISO(this.maxDate));
          if (isAfter(startOfDay(parsed), max2)) {
            this.internalError = `Date must be on or before ${this.maxDate}`;
            this.internals?.setValidity(
              { rangeOverflow: true },
              this.internalError,
              this.inputEl
            );
            return;
          }
        }
        this.value = isoString;
        this.displayValue = formatDateForDisplay(
          parsed,
          this.effectiveLocale,
          this.format ?? void 0
        );
        this.internalError = "";
        this.updateFormValue();
        this.validate();
        dispatchCustomEvent(this, "change", {
          date: parsed,
          isoString: this.value
        });
      } else {
        this.internalError = "Please enter a valid date";
        this.internals?.setValidity(
          { badInput: true },
          this.internalError,
          this.inputEl
        );
      }
    } else if (this.required) {
      this.internalError = "Please select a date";
      this.internals?.setValidity(
        { valueMissing: true },
        this.internalError,
        this.inputEl
      );
    } else {
      this.internalError = "";
      this.internals?.setValidity({});
      if (this.value) {
        this.value = "";
        this.displayValue = "";
        this.updateFormValue();
        dispatchCustomEvent(this, "change", {
          date: null,
          isoString: ""
        });
      }
    }
  }
  /**
   * Handle text input changes.
   */
  handleInput(e7) {
    const input = e7.target;
    this.inputValue = input.value;
    this.internalError = "";
  }
  /**
   * Handle keyboard events on the input.
   */
  handleInputKeydown(e7) {
    if (e7.key === "Enter") {
      this.inputEl?.blur();
    } else if (e7.key === "Escape") {
      if (this.open) {
        this.closePopup();
      } else {
        this.inputEl?.blur();
      }
    } else if (e7.key === "ArrowDown") {
      if (!this.open) {
        e7.preventDefault();
        this.openPopup();
      }
    }
  }
  /**
   * Toggle the calendar popup open/close.
   */
  togglePopup() {
    if (this.inline) return;
    if (this.open) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }
  /**
   * Open the calendar popup and position it via Floating UI.
   * Focuses the calendar after positioning for keyboard accessibility.
   */
  async openPopup() {
    if (this.inline) return;
    if (this.disabled) return;
    this.open = true;
    this.triggerElement = this.inputEl;
    await this.updateComplete;
    this.popupEl?.showPopover();
    this.positionPopup();
    requestAnimationFrame(() => {
      this.focusCalendar();
    });
  }
  /**
   * Close the calendar popup and restore focus to the trigger element.
   */
  closePopup() {
    try {
      this.popupEl?.hidePopover();
    } catch {
    }
    this.open = false;
    requestAnimationFrame(() => {
      this.triggerElement?.focus();
      this.triggerElement = null;
    });
  }
  /**
   * Focus the lui-calendar element inside the popup.
   * The calendar manages its own internal keyboard navigation.
   */
  focusCalendar() {
    const calendar = this.shadowRoot?.querySelector(
      "lui-calendar"
    );
    calendar?.focus();
  }
  /**
   * Position the popup using Floating UI with flip/shift middleware.
   * Uses fixed strategy to avoid clipping in scrollable containers.
   */
  async positionPopup() {
    if (o5) return;
    if (!this.inputContainerEl || !this.popupEl) return;
    const { x: x2, y: y3 } = await computePosition2(
      this.inputContainerEl,
      this.popupEl,
      {
        placement: "bottom-start",
        strategy: "fixed",
        middleware: [
          offset2(4),
          flip2({ fallbackPlacements: ["top-start"] }),
          shift2({ padding: 8 })
        ]
      }
    );
    Object.assign(this.popupEl.style, {
      left: `${x2}px`,
      top: `${y3}px`
    });
  }
  /**
   * Handle date selection from the calendar popup.
   */
  handleCalendarSelect(e7) {
    const detail = e7.detail;
    if (!detail) return;
    const date = detail.date;
    const isoString = detail.isoString;
    this.value = isoString;
    this.displayValue = formatDateForDisplay(
      date,
      this.effectiveLocale,
      this.format ?? void 0
    );
    this.internalError = "";
    this.updateFormValue();
    this.validate();
    if (!this.inline) {
      this.closePopup();
    }
    dispatchCustomEvent(this, "change", {
      date,
      isoString: this.value
    });
  }
  /**
   * Handle clear button click: reset all state.
   */
  handleClear() {
    this.value = "";
    this.displayValue = "";
    this.inputValue = "";
    this.internalError = "";
    this.updateFormValue();
    this.inputEl?.focus();
    dispatchCustomEvent(this, "change", {
      date: null,
      isoString: ""
    });
  }
  /**
   * Handle keyboard events on the popup.
   * Traps Tab/Shift+Tab within the popup and handles Escape to close.
   * Respects calendar's defaultPrevented for Escape key (view drilling).
   */
  handlePopupKeydown(e7) {
    if (e7.key === "Tab") {
      e7.preventDefault();
      this.focusCalendar();
    } else if (e7.key === "Escape") {
      if (!e7.defaultPrevented) {
        this.closePopup();
      }
    }
  }
  // ---------------------------------------------------------------------------
  // Form integration
  // ---------------------------------------------------------------------------
  /**
   * Sync the current value to the form via ElementInternals.
   */
  updateFormValue() {
    this.internals?.setFormValue(this.value || null);
  }
  /**
   * Validate the current state and set validity on ElementInternals.
   */
  validate() {
    if (!this.internals) return true;
    const anchor = this.inputEl ?? void 0;
    if (this.required && !this.value) {
      this.internals.setValidity(
        { valueMissing: true },
        "Please select a date",
        anchor
      );
      return false;
    }
    if (this.value && this.minDate) {
      const date = startOfDay(parseISO(this.value));
      const min2 = startOfDay(parseISO(this.minDate));
      if (isBefore(date, min2)) {
        this.internals.setValidity(
          { rangeUnderflow: true },
          `Date must be on or after ${this.minDate}`,
          anchor
        );
        return false;
      }
    }
    if (this.value && this.maxDate) {
      const date = startOfDay(parseISO(this.value));
      const max2 = startOfDay(parseISO(this.maxDate));
      if (isAfter(date, max2)) {
        this.internals.setValidity(
          { rangeOverflow: true },
          `Date must be on or before ${this.maxDate}`,
          anchor
        );
        return false;
      }
    }
    this.internals.setValidity({});
    return true;
  }
  /**
   * Form lifecycle callback: reset the date picker to initial state.
   */
  formResetCallback() {
    this.value = "";
    this.displayValue = "";
    this.inputValue = "";
    this.internalError = "";
    this.touched = false;
    this.open = false;
    this.internals?.setFormValue(null);
    this.internals?.setValidity({});
  }
  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled) {
    this.disabled = disabled;
  }
  // ---------------------------------------------------------------------------
  // Presets
  // ---------------------------------------------------------------------------
  /**
   * Check if a preset's resolved date falls outside min/max constraints.
   */
  isPresetDisabled(date) {
    const day = startOfDay(date);
    if (this.minDate) {
      const min2 = startOfDay(parseISO(this.minDate));
      if (isBefore(day, min2)) return true;
    }
    if (this.maxDate) {
      const max2 = startOfDay(parseISO(this.maxDate));
      if (isAfter(day, max2)) return true;
    }
    return false;
  }
  /**
   * Handle click on a preset button: select the date, close popup, dispatch event.
   */
  handlePresetSelect(preset) {
    const date = preset.resolve();
    this.value = format(date, "yyyy-MM-dd");
    this.displayValue = formatDateForDisplay(
      date,
      this.effectiveLocale,
      this.format ?? void 0
    );
    this.internalError = "";
    this.updateFormValue();
    this.validate();
    if (!this.inline) {
      this.closePopup();
    }
    dispatchCustomEvent(this, "change", {
      date,
      isoString: this.value
    });
  }
  /**
   * Render preset buttons above the calendar in the popup.
   * Returns nothing if no presets are configured.
   */
  renderPresets() {
    const presets = this.effectivePresets;
    if (presets.length === 0) return A;
    return b2`
      <div class="preset-buttons">
        ${presets.map((preset) => {
      const resolved = preset.resolve();
      const isDisabledPreset = this.isPresetDisabled(resolved);
      return b2`
            <button
              type="button"
              class="preset-button ${isDisabledPreset ? "preset-disabled" : ""}"
              ?disabled=${isDisabledPreset}
              @click=${() => this.handlePresetSelect(preset)}
            >${preset.label}</button>
          `;
    })}
      </div>
    `;
  }
  // ---------------------------------------------------------------------------
  // Inline mode
  // ---------------------------------------------------------------------------
  /**
   * Render the inline (always-visible) calendar layout.
   * Skips input field, popup, Floating UI, click-outside, and focus trap.
   * Still renders label, presets, calendar, helper text, and error text.
   */
  renderInlineCalendar() {
    return b2`
      <div class="inline-wrapper">
        ${this.label ? b2`
              <span class="date-picker-label">
                ${this.label}
                ${this.required ? b2`<span class="required-indicator">*</span>` : A}
              </span>
            ` : A}

        ${this.renderPresets()}

        <lui-calendar
          .value=${this.value}
          .locale=${this.effectiveLocale}
          min-date=${this.minDate || A}
          max-date=${this.maxDate || A}
          ?show-constraint-tooltips=${!!(this.minDate || this.maxDate)}
          @change=${this.handleCalendarSelect}
        ></lui-calendar>

        ${this.helperText && !this.hasError ? b2`<span class="helper-text">${this.helperText}</span>` : A}

        ${this.hasError && this.errorMessage ? b2`<span class="error-text" role="alert">${this.errorMessage}</span>` : A}
      </div>
    `;
  }
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  render() {
    if (this.inline) {
      return this.renderInlineCalendar();
    }
    const showInputValue = this.isEditing ? this.inputValue : this.displayValue;
    return b2`
      <div class="date-picker-wrapper">
        ${this.label ? b2`
              <label
                for=${this.inputId}
                class="date-picker-label"
              >
                ${this.label}
                ${this.required ? b2`<span class="required-indicator">*</span>` : A}
              </label>
            ` : A}

        <div
          class="input-container ${this.hasError ? "container-error" : ""} ${this.disabled ? "container-disabled" : ""}"
        >
          <input
            id=${this.inputId}
            type="text"
            .value=${showInputValue}
            placeholder=${this.effectivePlaceholder}
            ?required=${this.required}
            ?disabled=${this.disabled}
            aria-invalid=${this.hasError ? "true" : A}
            aria-errormessage=${this.hasError ? `${this.inputId}-error` : A}
            aria-describedby=${this.hasError ? `${this.inputId}-error` : this.helperText ? `${this.inputId}-helper` : A}
            aria-label=${!this.label ? "Date" : A}
            @focus=${this.handleInputFocus}
            @blur=${this.handleInputBlur}
            @input=${this.handleInput}
            @keydown=${this.handleInputKeydown}
          />

          ${this.value && !this.disabled ? b2`
                <button
                  type="button"
                  class="action-button"
                  aria-label="Clear date"
                  @click=${this.handleClear}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
                    ${this.clearIcon}
                  </svg>
                </button>
              ` : A}

          <button
            type="button"
            class="action-button"
            aria-label="Open calendar"
            ?disabled=${this.disabled}
            @click=${this.togglePopup}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
              ${this.calendarIcon}
            </svg>
          </button>
        </div>

        ${this.helperText && !this.hasError ? b2`
              <span
                id="${this.inputId}-helper"
                class="helper-text"
              >${this.helperText}</span>
            ` : A}

        ${this.hasError && this.errorMessage ? b2`
              <span
                id="${this.inputId}-error"
                class="error-text"
                role="alert"
              >${this.errorMessage}</span>
            ` : A}

        ${this.open ? b2`
              <div
                class="popup"
                popover="manual"
                role="dialog"
                aria-modal="true"
                aria-label="Choose date"
                @keydown=${this.handlePopupKeydown}
              >
                ${this.renderPresets()}
                <lui-calendar
                  .value=${this.value}
                  .locale=${this.effectiveLocale}
                  min-date=${this.minDate || A}
                  max-date=${this.maxDate || A}
                  ?show-constraint-tooltips=${!!(this.minDate || this.maxDate)}
                  @change=${this.handleCalendarSelect}
                ></lui-calendar>

              </div>
            ` : A}
      </div>
    `;
  }
};
__decorateClass([
  e5(".input-container")
], DatePicker.prototype, "inputContainerEl", 2);
__decorateClass([
  e5(".popup")
], DatePicker.prototype, "popupEl", 2);
__decorateClass([
  e5("input")
], DatePicker.prototype, "inputEl", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], DatePicker.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], DatePicker.prototype, "name", 2);
__decorateClass([
  n4({ type: String })
], DatePicker.prototype, "locale", 2);
__decorateClass([
  n4({ type: String })
], DatePicker.prototype, "placeholder", 2);
__decorateClass([
  n4({ type: String, attribute: "helper-text" })
], DatePicker.prototype, "helperText", 2);
__decorateClass([
  n4({ type: String, attribute: "min-date" })
], DatePicker.prototype, "minDate", 2);
__decorateClass([
  n4({ type: String, attribute: "max-date" })
], DatePicker.prototype, "maxDate", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], DatePicker.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], DatePicker.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], DatePicker.prototype, "inline", 2);
__decorateClass([
  n4({ type: String })
], DatePicker.prototype, "error", 2);
__decorateClass([
  n4({ type: String })
], DatePicker.prototype, "label", 2);
__decorateClass([
  n4({
    converter: {
      fromAttribute: () => true
    }
  })
], DatePicker.prototype, "presets", 2);
__decorateClass([
  n4({ attribute: false })
], DatePicker.prototype, "format", 2);
__decorateClass([
  r5()
], DatePicker.prototype, "open", 2);
__decorateClass([
  r5()
], DatePicker.prototype, "displayValue", 2);
__decorateClass([
  r5()
], DatePicker.prototype, "inputValue", 2);
__decorateClass([
  r5()
], DatePicker.prototype, "isEditing", 2);
__decorateClass([
  r5()
], DatePicker.prototype, "touched", 2);
__decorateClass([
  r5()
], DatePicker.prototype, "internalError", 2);
if (!customElements.get("lui-date-picker")) {
  customElements.define("lui-date-picker", DatePicker);
}

// src/components/ui/range-preset-types.ts
var DEFAULT_RANGE_PRESETS = [
  {
    label: "Last 7 Days",
    resolve: () => ({
      start: subDays(startOfDay(/* @__PURE__ */ new Date()), 6),
      end: startOfDay(/* @__PURE__ */ new Date())
    })
  },
  {
    label: "Last 30 Days",
    resolve: () => ({
      start: subDays(startOfDay(/* @__PURE__ */ new Date()), 29),
      end: startOfDay(/* @__PURE__ */ new Date())
    })
  },
  {
    label: "This Month",
    resolve: () => ({
      start: startOfMonth(/* @__PURE__ */ new Date()),
      end: endOfMonth(/* @__PURE__ */ new Date())
    })
  }
];

// src/components/ui/range-utils.ts
function isDateInRange(dateISO, startISO, endISO) {
  if (!dateISO || !startISO || !endISO) return false;
  const date = startOfDay(parseISO(dateISO));
  const start = startOfDay(parseISO(startISO));
  const end = startOfDay(parseISO(endISO));
  return isWithinInterval(date, { start, end });
}
function validateRangeDuration(startISO, endISO, minDays, maxDays) {
  if (!startISO || !endISO) {
    return { valid: false, error: "Start and end dates are required" };
  }
  const start = startOfDay(parseISO(startISO));
  const end = startOfDay(parseISO(endISO));
  const days = differenceInCalendarDays(end, start) + 1;
  if (days < 1) {
    return { valid: false, error: "End date must be on or after start date" };
  }
  if (minDays && minDays > 0 && days < minDays) {
    return { valid: false, error: `Range must be at least ${minDays} day${minDays === 1 ? "" : "s"}` };
  }
  if (maxDays && maxDays > 0 && days > maxDays) {
    return { valid: false, error: `Range must be at most ${maxDays} day${maxDays === 1 ? "" : "s"}` };
  }
  return { valid: true, error: "" };
}
function formatISOInterval(startISO, endISO) {
  if (!startISO || !endISO) return "";
  return `${startISO}/${endISO}`;
}
function isDateInPreview(dateISO, startISO, hoveredISO) {
  if (!dateISO || !startISO || !hoveredISO) return false;
  const date = startOfDay(parseISO(dateISO));
  const start = startOfDay(parseISO(startISO));
  const hovered = startOfDay(parseISO(hoveredISO));
  const rangeStart = isBefore(hovered, start) ? hovered : start;
  const rangeEnd = isBefore(hovered, start) ? start : hovered;
  return isWithinInterval(date, { start: rangeStart, end: rangeEnd });
}
function computeRangeDuration(startISO, endISO) {
  if (!startISO || !endISO) return 0;
  const start = startOfDay(parseISO(startISO));
  const end = startOfDay(parseISO(endISO));
  return differenceInCalendarDays(end, start) + 1;
}
function normalizeRange(startISO, endISO) {
  if (!startISO || !endISO) return [startISO, endISO];
  const start = startOfDay(parseISO(startISO));
  const end = startOfDay(parseISO(endISO));
  if (isBefore(end, start)) {
    return [endISO, startISO];
  }
  return [startISO, endISO];
}

// src/components/ui/date-range-picker.ts
var DateRangePicker = class extends TailwindElement {
  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------
  constructor() {
    super();
    /**
     * ElementInternals for form participation.
     * Null during SSR since attachInternals() is not available.
     */
    this.internals = null;
    /**
     * Unique ID for the input element, used for label association.
     */
    this.inputId = `lui-date-range-picker-${Math.random().toString(36).substr(2, 9)}`;
    /**
     * Reference to the trigger element for focus restoration after popup close.
     */
    this.triggerElement = null;
    this.startDate = "";
    this.endDate = "";
    this.name = "";
    this.locale = "";
    this.placeholder = "";
    this.label = "";
    this.helperText = "";
    this.minDate = "";
    this.maxDate = "";
    this.minDays = 0;
    this.maxDays = 0;
    this.required = false;
    this.disabled = false;
    this.error = "";
    this.comparison = false;
    this.compareStartDate = "";
    this.compareEndDate = "";
    this.presets = false;
    this.rangeState = "idle";
    this.hoveredDate = "";
    this.isOpen = false;
    this.currentMonth = /* @__PURE__ */ new Date();
    this.internalError = "";
    this.isDragging = false;
    this.selectionTarget = "primary";
    this.compareRangeState = "idle";
    // ---------------------------------------------------------------------------
    // SVG Icons
    // ---------------------------------------------------------------------------
    this.calendarIcon = w`
    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
          stroke="currentColor" stroke-width="2" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
  `;
    this.clearIcon = w`
    <circle cx="12" cy="12" r="10"
            stroke="currentColor" stroke-width="2" fill="none"/>
    <line x1="15" y1="9" x2="9" y2="15"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="9" y1="9" x2="15" y2="15"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  `;
    // ---------------------------------------------------------------------------
    // Range day rendering (inline styles for Shadow DOM compatibility)
    // ---------------------------------------------------------------------------
    /**
     * Render callback for calendar day cells with range highlighting.
     * Uses inline styles because CSS classes defined here cannot reach
     * inside the calendar's Shadow DOM (Pitfall 1).
     *
     * Arrow function to preserve `this` binding when passed to lui-calendar.
     */
    this.renderRangeDay = (state) => {
      const dateStr = state.formattedDate;
      const isStart = dateStr === this.startDate;
      const isEnd = dateStr === this.endDate;
      const inRange = isDateInRange(dateStr, this.startDate, this.endDate);
      const inPreview = this.rangeState === "start-selected" && !(this.comparison && this.selectionTarget === "comparison") ? isDateInPreview(dateStr, this.startDate, this.hoveredDate) : false;
      const isCompareStart = this.comparison && dateStr === this.compareStartDate;
      const isCompareEnd = this.comparison && dateStr === this.compareEndDate;
      const inCompareRange = this.comparison && isDateInRange(dateStr, this.compareStartDate, this.compareEndDate);
      const inComparePreview = this.comparison && this.selectionTarget === "comparison" && this.compareRangeState === "start-selected" ? isDateInPreview(dateStr, this.compareStartDate, this.hoveredDate) : false;
      const styles = [
        "display: flex",
        "align-items: center",
        "justify-content: center",
        "width: 100%",
        "height: 100%",
        "border-radius: 0",
        "transition: background-color 150ms"
      ];
      const isSingleDay = isStart && isEnd;
      if (isSingleDay) {
        styles.push(
          "background-color: var(--ui-range-selected-bg, var(--color-primary))",
          "color: var(--ui-range-selected-text)",
          "border-radius: 9999px"
        );
      } else if (isStart) {
        styles.push(
          "background-color: var(--ui-range-selected-bg, var(--color-primary))",
          "color: var(--ui-range-selected-text)",
          "border-radius: 9999px 0 0 9999px"
        );
      } else if (isEnd) {
        styles.push(
          "background-color: var(--ui-range-selected-bg, var(--color-primary))",
          "color: var(--ui-range-selected-text)",
          "border-radius: 0 9999px 9999px 0"
        );
      } else if (inRange) {
        styles.push(
          "background-color: var(--ui-range-highlight-bg, color-mix(in oklch, var(--color-primary, var(--ui-color-primary)) 12%, var(--color-background)))",
          "color: var(--ui-range-highlight-text)"
        );
      } else if (inPreview) {
        styles.push(
          "background-color: var(--ui-range-preview-bg, color-mix(in oklch, var(--color-primary, var(--ui-color-primary)) 6%, var(--color-background)))"
        );
      } else if (isCompareStart && isCompareEnd) {
        styles.push(
          "background-color: var(--ui-date-range-compare-bg)",
          "color: var(--ui-date-range-compare-text)",
          "border-radius: 9999px"
        );
      } else if (isCompareStart) {
        styles.push(
          "background-color: var(--ui-date-range-compare-bg)",
          "color: var(--ui-date-range-compare-text)",
          "border-radius: 9999px 0 0 9999px"
        );
      } else if (isCompareEnd) {
        styles.push(
          "background-color: var(--ui-date-range-compare-bg)",
          "color: var(--ui-date-range-compare-text)",
          "border-radius: 0 9999px 9999px 0"
        );
      } else if (inCompareRange) {
        styles.push(
          "background-color: var(--ui-date-range-compare-highlight-bg)",
          "color: inherit"
        );
      } else if (inComparePreview) {
        styles.push("background-color: var(--ui-date-range-compare-preview-bg)");
      }
      return b2`
      <span
        style="${styles.join("; ")}"
        @mouseenter="${() => this.handleDayHover(dateStr)}"
        @pointerdown="${(e7) => {
        e7.preventDefault();
        this.handleDragStart(dateStr);
      }}"
        @pointerup="${() => this.handleDragEnd(dateStr)}"
      >
        ${state.date.getDate()}
      </span>
    `;
    };
    // ---------------------------------------------------------------------------
    // Click-outside detection
    // ---------------------------------------------------------------------------
    /**
     * Handle document clicks for closing popup when clicking outside.
     * Uses composedPath() to work correctly with Shadow DOM boundaries.
     */
    this.handleDocumentClick = (e7) => {
      if (this.isOpen && !e7.composedPath().includes(this)) {
        this.closePopup();
      }
    };
    if (!o5) {
      this.internals = this.attachInternals();
    }
  }
  static {
    /**
     * Enable form association for this custom element.
     */
    this.formAssociated = true;
  }
  static {
    // ---------------------------------------------------------------------------
    // Styles
    // ---------------------------------------------------------------------------
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: block;
        width: 100%;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      .date-range-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        position: relative;
      }

      .date-range-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--ui-date-range-label-text);
      }

      .required-indicator {
        color: var(--ui-date-range-error, var(--ui-input-text-error));
        margin-left: 0.125rem;
      }

      .input-container {
        display: flex;
        align-items: center;
        border-radius: var(--ui-date-range-radius, var(--ui-input-radius));
        border-width: var(--ui-date-range-border-width, var(--ui-input-border-width));
        border-style: solid;
        border-color: var(--ui-date-range-border, var(--ui-input-border));
        background-color: var(--ui-date-range-bg, var(--ui-input-bg));
        transition:
          border-color 150ms,
          box-shadow 150ms;
        cursor: pointer;
      }

      .input-container:focus-within {
        border-color: var(--ui-date-range-border-focus, var(--ui-input-border-focus));
      }

      .input-container.container-error {
        border-color: var(--ui-date-range-error, var(--ui-input-border-error));
      }

      .input-container.container-disabled {
        background-color: var(--ui-date-range-bg-disabled, var(--ui-input-bg-disabled));
        border-color: var(--ui-date-range-border-disabled, var(--ui-input-border-disabled));
        cursor: not-allowed;
      }

      input {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        color: var(--ui-date-range-text, var(--ui-input-text));
        outline: none;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        cursor: pointer;
      }

      input::placeholder {
        color: var(--ui-date-range-placeholder, var(--ui-input-placeholder));
      }

      input:disabled {
        color: var(--ui-date-range-text-disabled, var(--ui-input-text-disabled));
        cursor: not-allowed;
      }

      .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        margin-right: 0.25rem;
        border: none;
        background: transparent;
        color: var(--ui-date-range-action-text);
        cursor: pointer;
        border-radius: 0.25rem;
        transition:
          color 150ms,
          background-color 150ms;
      }

      .action-button:hover {
        color: var(--ui-date-range-text, var(--ui-input-text));
        background-color: var(--ui-date-range-hover-bg);
      }

      .action-button:focus-visible {
        outline: 2px solid var(--ui-date-range-ring);
        outline-offset: 1px;
      }

      .action-icon {
        width: 1.25em;
        height: 1.25em;
      }

      .popup {
        position: fixed;
        inset: auto;
        margin: 0;
        z-index: var(--ui-date-range-z-index, 50);
        background-color: var(--ui-date-range-popup-bg);
        border: 1px solid var(--ui-date-range-popup-border);
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        padding: 0.5rem;
      }

      .helper-text {
        font-size: 0.75rem;
        color: var(--ui-date-range-helper-text);
      }

      .error-text {
        font-size: 0.75rem;
        color: var(--ui-date-range-error, var(--ui-input-text-error));
      }

      .popup-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
        border-top: 1px solid var(--ui-date-range-footer-border);
        margin-top: 0.25rem;
      }

      .footer-status {
        font-size: 0.75rem;
        color: var(--ui-date-range-helper-text);
      }

      .footer-clear-button {
        font-size: 0.75rem;
        padding: 0.25rem 0.75rem;
        border: 1px solid var(--ui-date-range-clear-border);
        border-radius: 0.25rem;
        background: transparent;
        color: var(--ui-date-range-clear-text);
        cursor: pointer;
        transition: background-color 150ms, border-color 150ms;
      }

      .footer-clear-button:hover {
        background-color: var(--ui-date-range-clear-hover-bg);
        border-color: var(--ui-date-range-clear-hover-border);
      }

      .footer-clear-button:focus-visible {
        outline: 2px solid var(--ui-date-range-ring);
        outline-offset: 1px;
      }

      .range-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
      }

      .range-heading {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
      }

      .calendars-wrapper {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .calendars-wrapper > * {
        min-width: 240px;
        flex: 1 1 280px;
      }

      .nav-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border: none;
        background: none;
        cursor: pointer;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        color: var(--ui-calendar-nav-color, currentColor);
      }

      .nav-button:hover {
        background-color: var(--ui-date-range-hover-bg);
      }

      .nav-button:focus-visible {
        outline: 2px solid var(--ui-date-range-ring);
        outline-offset: 2px;
      }

      .nav-button svg {
        width: 1rem;
        height: 1rem;
      }

      .popup-body {
        display: flex;
      }

      .preset-sidebar {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.5rem;
        border-right: 1px solid var(--ui-date-range-sidebar-border);
        min-width: 120px;
      }

      .preset-button {
        font-size: 0.75rem;
        padding: 0.375rem 0.75rem;
        border: none;
        border-radius: 0.25rem;
        background: transparent;
        color: var(--ui-date-range-text, var(--ui-input-text));
        cursor: pointer;
        text-align: left;
        white-space: nowrap;
        transition: background-color 150ms;
      }

      .preset-button:hover:not(:disabled) {
        background-color: var(--ui-date-range-hover-bg);
      }

      .preset-button:focus-visible {
        outline: 2px solid var(--ui-date-range-ring);
        outline-offset: 1px;
      }

      .preset-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Prevent text selection during pointer drag */
      .calendars-wrapper.dragging {
        user-select: none;
        -webkit-user-select: none;
      }

      /* Comparison toggle buttons */
      .comparison-toggle {
        display: flex;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        border-bottom: 1px solid var(--ui-date-range-popup-border);
      }

      .toggle-button {
        flex: 1;
        font-size: 0.75rem;
        padding: 0.375rem 0.5rem;
        border: 1px solid var(--ui-date-range-toggle-border);
        border-radius: 0.25rem;
        background: transparent;
        color: var(--ui-date-range-toggle-text);
        cursor: pointer;
        transition: background-color 150ms, border-color 150ms;
      }

      .toggle-button:hover {
        background-color: var(--ui-date-range-toggle-hover-bg);
      }

      .toggle-button:focus-visible {
        outline: 2px solid var(--ui-date-range-ring);
        outline-offset: 1px;
      }

      .toggle-active.toggle-primary {
        background-color: var(--ui-range-selected-bg, var(--color-primary));
        color: var(--ui-range-selected-text);
        border-color: var(--ui-range-selected-bg, var(--color-primary));
      }

      .toggle-active.toggle-comparison {
        background-color: var(--ui-date-range-compare-bg);
        color: var(--ui-date-range-compare-text);
        border-color: var(--ui-date-range-compare-bg);
      }

      /* Media query: vertical stacking for narrow viewports */
      @media (max-width: 599px) {
        .popup-body {
          flex-direction: column;
        }

        .preset-sidebar {
          flex-direction: row;
          flex-wrap: wrap;
          border-right: none;
          border-bottom: 1px solid var(--ui-date-range-sidebar-border);
        }

        .calendars-wrapper {
          flex-direction: column;
        }
      }

      /* Media query: wider gap for spacious viewports */
      @media (min-width: 800px) {
        .calendars-wrapper {
          gap: 1.5rem;
        }
      }
    `
    ];
  }
  // ---------------------------------------------------------------------------
  // Computed getters
  // ---------------------------------------------------------------------------
  /**
   * Resolved locale, falling back to navigator.language or 'en-US'.
   */
  get effectiveLocale() {
    return this.locale || (o5 ? "en-US" : navigator.language);
  }
  /**
   * Whether the component is in an error state.
   */
  get hasError() {
    return !!(this.error || this.internalError);
  }
  /**
   * The current error message to display.
   */
  get displayError() {
    return this.error || this.internalError;
  }
  /**
   * Formatted display value for the input field.
   * - Both dates: "Jan 15 – Jan 22, 2026"
   * - Only start: "Jan 15, 2026 – ..."
   * - None: empty (shows placeholder)
   */
  get displayValue() {
    if (!this.startDate) return "";
    const startDate = parseISO(this.startDate);
    const locale = this.effectiveLocale;
    if (this.startDate && this.endDate) {
      const endDate = parseISO(this.endDate);
      const sameYear = startDate.getFullYear() === endDate.getFullYear();
      if (sameYear) {
        const startFmt2 = new Intl.DateTimeFormat(locale, {
          month: "short",
          day: "numeric"
        });
        const endFmt = new Intl.DateTimeFormat(locale, {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
        return `${startFmt2.format(startDate)} \u2013 ${endFmt.format(endDate)}`;
      }
      const fullFmt = new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      return `${fullFmt.format(startDate)} \u2013 ${fullFmt.format(endDate)}`;
    }
    const startFmt = new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    return `${startFmt.format(startDate)} \u2013 ...`;
  }
  /**
   * Effective placeholder text for the input.
   */
  get effectivePlaceholder() {
    return this.placeholder || "Select date range";
  }
  /**
   * Status message for the popup footer based on current selection state.
   */
  get selectionStatus() {
    if (this.comparison && this.selectionTarget === "comparison") {
      if (this.compareRangeState === "idle")
        return "Click a date to start comparison range";
      if (this.compareRangeState === "start-selected")
        return "Click another date to complete comparison";
      if (this.compareRangeState === "complete") return this.displayValue;
      return "";
    }
    if (this.rangeState === "idle") return "Click a date to start selecting";
    if (this.rangeState === "start-selected")
      return "Click another date to complete range";
    if (this.rangeState === "complete") return this.displayValue;
    return "";
  }
  /**
   * Resolved presets array based on the presets property.
   * - true: returns DEFAULT_RANGE_PRESETS
   * - array: returns the array as-is
   * - false: returns empty array (no presets)
   */
  get effectivePresets() {
    if (this.presets === true) return DEFAULT_RANGE_PRESETS;
    if (Array.isArray(this.presets)) return this.presets;
    return [];
  }
  /**
   * Duration text for the popup footer when a range is complete.
   * Shows inclusive day count (e.g., "7 days selected").
   */
  get durationText() {
    if (this.comparison && this.selectionTarget === "comparison") {
      if (this.compareRangeState !== "complete" || !this.compareStartDate || !this.compareEndDate)
        return "";
      const days2 = computeRangeDuration(
        this.compareStartDate,
        this.compareEndDate
      );
      return `${days2} day${days2 === 1 ? "" : "s"} selected (comparison)`;
    }
    if (this.rangeState !== "complete" || !this.startDate || !this.endDate)
      return "";
    const days = computeRangeDuration(this.startDate, this.endDate);
    return `${days} day${days === 1 ? "" : "s"} selected`;
  }
  // ---------------------------------------------------------------------------
  // State machine methods
  // ---------------------------------------------------------------------------
  /**
   * Handle a date click in the calendar.
   * Implements the two-click state machine:
   * - idle/complete -> start-selected (first click sets start)
   * - start-selected -> complete (second click sets end with auto-swap)
   *
   * @param isoString - ISO 8601 date string of the clicked date
   */
  handleDateClick(isoString) {
    if (this.disabled) return;
    if (this.comparison && this.selectionTarget === "comparison") {
      this.handleComparisonDateClick(isoString);
      return;
    }
    if (this.rangeState === "idle" || this.rangeState === "complete") {
      this.startDate = isoString;
      this.endDate = "";
      this.internalError = "";
      this.rangeState = "start-selected";
    } else if (this.rangeState === "start-selected") {
      const [normalizedStart, normalizedEnd] = normalizeRange(
        this.startDate,
        isoString
      );
      this.startDate = normalizedStart;
      this.endDate = normalizedEnd;
      this.hoveredDate = "";
      this.rangeState = "complete";
      this.validateAndEmit();
    }
  }
  /**
   * Handle a date click for the comparison range.
   * Same two-click state machine as primary but targeting comparison dates.
   *
   * @param isoString - ISO 8601 date string of the clicked date
   */
  handleComparisonDateClick(isoString) {
    if (this.compareRangeState === "idle" || this.compareRangeState === "complete") {
      this.compareStartDate = isoString;
      this.compareEndDate = "";
      this.compareRangeState = "start-selected";
    } else if (this.compareRangeState === "start-selected") {
      const [normalizedStart, normalizedEnd] = normalizeRange(
        this.compareStartDate,
        isoString
      );
      this.compareStartDate = normalizedStart;
      this.compareEndDate = normalizedEnd;
      this.hoveredDate = "";
      this.compareRangeState = "complete";
      this.validateAndEmit();
    }
  }
  /**
   * Validate the current range and emit change event.
   * Validation runs AFTER auto-swap via normalizeRange() (Pitfall 4).
   * Updates internal error state, form value, and ElementInternals validity.
   * Closes the popup on valid complete range.
   */
  validateAndEmit() {
    this.updateFormValue();
    const isValid2 = this.validate();
    const isoInterval = formatISOInterval(this.startDate, this.endDate);
    dispatchCustomEvent(this, "change", {
      startDate: this.startDate,
      endDate: this.endDate,
      isoInterval,
      ...this.comparison ? {
        compareStartDate: this.compareStartDate,
        compareEndDate: this.compareEndDate,
        compareIsoInterval: formatISOInterval(
          this.compareStartDate,
          this.compareEndDate
        )
      } : {}
    });
    if (isValid2 && this.rangeState === "complete") {
      this.closePopup();
    }
  }
  /**
   * Handle hover over a day cell for preview highlighting.
   * Only active during start-selected state.
   *
   * @param dateStr - ISO 8601 date string of the hovered date
   */
  handleDayHover(dateStr) {
    const activeState = this.comparison && this.selectionTarget === "comparison" ? this.compareRangeState : this.rangeState;
    if (activeState === "start-selected") {
      this.hoveredDate = dateStr;
    }
  }
  /**
   * Clear the hover preview state.
   */
  clearHoverPreview() {
    this.hoveredDate = "";
  }
  // ---------------------------------------------------------------------------
  // Preset selection
  // ---------------------------------------------------------------------------
  /**
   * Handle a preset button click.
   * Resolves the preset dates, sets both start and end, and emits change.
   *
   * @param preset - The preset to apply
   */
  handlePresetSelect(preset) {
    const { start, end } = preset.resolve();
    const startISO = format(start, "yyyy-MM-dd");
    const endISO = format(end, "yyyy-MM-dd");
    if (this.comparison && this.selectionTarget === "comparison") {
      this.compareStartDate = startISO;
      this.compareEndDate = endISO;
      this.compareRangeState = "complete";
    } else {
      this.startDate = startISO;
      this.endDate = endISO;
      this.rangeState = "complete";
    }
    this.validateAndEmit();
  }
  /**
   * Check if a preset's resolved range falls outside min/max constraints.
   *
   * @param preset - The preset to check
   * @returns true if the preset should be disabled
   */
  isPresetDisabled(preset) {
    const { start, end } = preset.resolve();
    if (this.minDate) {
      const min2 = parseISO(this.minDate);
      if (isBefore(start, min2)) return true;
    }
    if (this.maxDate) {
      const max2 = parseISO(this.maxDate);
      if (isAfter(end, max2)) return true;
    }
    return false;
  }
  // ---------------------------------------------------------------------------
  // Drag selection (pointer events)
  // ---------------------------------------------------------------------------
  /**
   * Start a drag selection on pointerdown.
   * Enters start-selected state (same as first click in two-click flow).
   *
   * @param isoString - ISO 8601 date string of the pressed day cell
   */
  handleDragStart(isoString) {
    if (this.disabled) return;
    this.isDragging = true;
    if (this.comparison && this.selectionTarget === "comparison") {
      this.compareStartDate = isoString;
      this.compareEndDate = "";
      this.compareRangeState = "start-selected";
    } else {
      this.startDate = isoString;
      this.endDate = "";
      this.internalError = "";
      this.rangeState = "start-selected";
    }
  }
  /**
   * Complete a drag selection on pointerup over a day cell.
   * If released on a different cell than start, completes the range.
   * If released on the same cell, stays in start-selected for click-to-complete.
   *
   * @param isoString - ISO 8601 date string of the released day cell
   */
  handleDragEnd(isoString) {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (this.comparison && this.selectionTarget === "comparison") {
      if (this.compareRangeState === "start-selected" && isoString !== this.compareStartDate) {
        const [normalizedStart, normalizedEnd] = normalizeRange(
          this.compareStartDate,
          isoString
        );
        this.compareStartDate = normalizedStart;
        this.compareEndDate = normalizedEnd;
        this.hoveredDate = "";
        this.compareRangeState = "complete";
        this.validateAndEmit();
      }
    } else {
      if (this.rangeState === "start-selected" && isoString !== this.startDate) {
        const [normalizedStart, normalizedEnd] = normalizeRange(
          this.startDate,
          isoString
        );
        this.startDate = normalizedStart;
        this.endDate = normalizedEnd;
        this.hoveredDate = "";
        this.rangeState = "complete";
        this.validateAndEmit();
      }
    }
  }
  /**
   * Cancel a drag when pointer is released outside day cells.
   * Keeps start-selected state so user can still click to complete.
   */
  handleDragCancel() {
    if (this.isDragging) {
      this.isDragging = false;
    }
  }
  /**
   * Reset the range picker to idle state.
   * Clears all selection, updates form value, validates, and dispatches change.
   */
  handleClear(e7) {
    e7?.stopPropagation();
    this.startDate = "";
    this.endDate = "";
    this.hoveredDate = "";
    this.internalError = "";
    this.rangeState = "idle";
    if (this.comparison) {
      this.compareStartDate = "";
      this.compareEndDate = "";
      this.compareRangeState = "idle";
      this.selectionTarget = "primary";
    }
    this.updateFormValue();
    this.validate();
    dispatchCustomEvent(this, "change", {
      startDate: "",
      endDate: "",
      isoInterval: "",
      ...this.comparison ? {
        compareStartDate: "",
        compareEndDate: "",
        compareIsoInterval: ""
      } : {}
    });
    this.inputEl?.focus();
  }
  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  /**
   * Sync range state and form value when properties change externally.
   */
  updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has("startDate") || changedProps.has("endDate")) {
      if (this.startDate && this.endDate && this.rangeState !== "complete") {
        this.rangeState = "complete";
      }
      this.updateFormValue();
      this.validate();
    }
    if (changedProps.has("compareStartDate") || changedProps.has("compareEndDate")) {
      if (this.compareStartDate && this.compareEndDate && this.compareRangeState !== "complete") {
        this.compareRangeState = "complete";
      }
      this.updateFormValue();
    }
  }
  // ---------------------------------------------------------------------------
  // Form integration
  // ---------------------------------------------------------------------------
  /**
   * Sync the current range value to the form via ElementInternals.
   * Sets form value as ISO 8601 interval (YYYY-MM-DD/YYYY-MM-DD) or null.
   */
  updateFormValue() {
    const primaryInterval = formatISOInterval(this.startDate, this.endDate);
    if (this.comparison && this.compareStartDate && this.compareEndDate) {
      const compareInterval = formatISOInterval(
        this.compareStartDate,
        this.compareEndDate
      );
      this.internals?.setFormValue(
        primaryInterval ? `${primaryInterval}|${compareInterval}` : null
      );
    } else {
      this.internals?.setFormValue(primaryInterval || null);
    }
  }
  /**
   * Validate the current state and set validity on ElementInternals.
   * Checks required (valueMissing) first, then duration constraints (customError).
   * Clears validity if all checks pass.
   *
   * @returns true if valid, false if invalid
   */
  validate() {
    if (!this.internals) return true;
    const anchor = this.inputEl ?? void 0;
    if (this.required && (!this.startDate || !this.endDate)) {
      const msg = "Please select a date range";
      this.internalError = msg;
      this.internals.setValidity({ valueMissing: true }, msg, anchor);
      return false;
    }
    if (this.startDate && this.endDate) {
      const validation = validateRangeDuration(
        this.startDate,
        this.endDate,
        this.minDays || void 0,
        this.maxDays || void 0
      );
      if (!validation.valid) {
        this.internalError = validation.error;
        this.internals.setValidity(
          { customError: true },
          validation.error,
          anchor
        );
        return false;
      }
    }
    this.internalError = "";
    this.internals.setValidity({});
    return true;
  }
  /**
   * Form lifecycle callback: reset the date range picker to initial state.
   */
  formResetCallback() {
    this.startDate = "";
    this.endDate = "";
    this.hoveredDate = "";
    this.internalError = "";
    this.rangeState = "idle";
    this.isOpen = false;
    this.compareStartDate = "";
    this.compareEndDate = "";
    this.compareRangeState = "idle";
    this.selectionTarget = "primary";
    this.internals?.setFormValue(null);
    this.internals?.setValidity({});
  }
  /**
   * Form lifecycle callback: restore state from ISO interval string.
   * Parses "YYYY-MM-DD/YYYY-MM-DD" back into start and end dates.
   */
  formStateRestoreCallback(state) {
    if (!state || typeof state !== "string") return;
    const parts = state.split("/");
    if (parts.length === 2) {
      this.startDate = parts[0];
      this.endDate = parts[1];
      this.rangeState = "complete";
      this.updateFormValue();
      this.validate();
    }
  }
  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled) {
    this.disabled = disabled;
  }
  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  /**
   * Navigate to the previous month.
   */
  navigatePrev() {
    this.currentMonth = subMonths(this.currentMonth, 1);
  }
  /**
   * Navigate to the next month.
   */
  navigateNext() {
    this.currentMonth = addMonths(this.currentMonth, 1);
  }
  /**
   * Compute the range heading showing the two visible months with en-dash.
   * Examples: "January \u2013 February 2026" or "December 2025 \u2013 January 2026"
   */
  get rangeHeading() {
    const firstMonth = this.currentMonth;
    const secondMonth = addMonths(this.currentMonth, 1);
    const firstYear = getYear(firstMonth);
    const secondYear = getYear(secondMonth);
    const monthFormatter = new Intl.DateTimeFormat(this.effectiveLocale, {
      month: "long"
    });
    const firstName = monthFormatter.format(firstMonth);
    const secondName = monthFormatter.format(secondMonth);
    if (firstYear === secondYear) {
      return `${firstName} \u2013 ${secondName} ${secondYear}`;
    }
    return `${firstName} ${firstYear} \u2013 ${secondName} ${secondYear}`;
  }
  /**
   * Handle date selection from a child calendar's change event.
   * Extracts the ISO string and delegates to the state machine.
   */
  handleCalendarSelect(e7) {
    const detail = e7.detail;
    if (!detail?.isoString) return;
    this.handleDateClick(detail.isoString);
  }
  // ---------------------------------------------------------------------------
  // Popup management
  // ---------------------------------------------------------------------------
  /**
   * Open the calendar popup and position it via Floating UI.
   * Focuses the first calendar after positioning for keyboard accessibility.
   */
  async openPopup() {
    if (this.disabled) return;
    this.isOpen = true;
    this.triggerElement = this.shadowRoot?.activeElement || this.inputEl;
    await this.updateComplete;
    this.popupEl?.showPopover();
    this.positionPopup();
    requestAnimationFrame(() => {
      this.focusCalendar();
    });
  }
  /**
   * Close the calendar popup and restore focus to the trigger element.
   * Clears hover preview state for clean reopen.
   */
  closePopup() {
    try {
      this.popupEl?.hidePopover();
    } catch {
    }
    this.isOpen = false;
    this.hoveredDate = "";
    requestAnimationFrame(() => {
      this.triggerElement?.focus();
      this.triggerElement = null;
    });
  }
  /**
   * Toggle the calendar popup open/close.
   */
  togglePopup() {
    if (this.isOpen) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }
  /**
   * Focus the first lui-calendar element inside the popup.
   * The calendar manages its own internal keyboard navigation.
   */
  focusCalendar() {
    const calendar = this.shadowRoot?.querySelector(
      ".popup lui-calendar"
    );
    calendar?.focus();
  }
  /**
   * Position the popup using Floating UI with flip/shift middleware.
   * Uses fixed strategy to avoid clipping in scrollable containers.
   */
  async positionPopup() {
    if (o5) return;
    if (!this.inputContainerEl || !this.popupEl) return;
    const { x: x2, y: y3 } = await computePosition2(
      this.inputContainerEl,
      this.popupEl,
      {
        placement: "bottom-start",
        strategy: "fixed",
        middleware: [
          offset2(4),
          flip2({ fallbackPlacements: ["top-start"] }),
          shift2({ padding: 8 })
        ]
      }
    );
    Object.assign(this.popupEl.style, {
      left: `${x2}px`,
      top: `${y3}px`
    });
  }
  connectedCallback() {
    super.connectedCallback();
    if (!o5) {
      document.addEventListener("click", this.handleDocumentClick);
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (!o5) {
      document.removeEventListener("click", this.handleDocumentClick);
    }
  }
  // ---------------------------------------------------------------------------
  // Keyboard handling
  // ---------------------------------------------------------------------------
  /**
   * Handle keyboard events on the popup.
   * Traps Tab/Shift+Tab within the popup and handles Escape to close.
   * Respects calendar's defaultPrevented for Escape key (view drilling).
   */
  handlePopupKeydown(e7) {
    if (e7.key === "Tab") {
      e7.preventDefault();
      this.focusCalendar();
    } else if (e7.key === "Escape") {
      if (!e7.defaultPrevented) {
        this.closePopup();
      }
    }
  }
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  /**
   * Render the dual-calendar popup content (header + calendars).
   */
  renderCalendarContent() {
    const leftDisplayMonth = format(this.currentMonth, "yyyy-MM-dd");
    const rightDisplayMonth = format(
      addMonths(this.currentMonth, 1),
      "yyyy-MM-dd"
    );
    return b2`
      <div class="range-header">
        <button
          class="nav-button"
          @click="${this.navigatePrev}"
          aria-label="Previous month"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 class="range-heading">${this.rangeHeading}</h2>
        <button
          class="nav-button"
          @click="${this.navigateNext}"
          aria-label="Next month"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      ${this.comparison ? b2`
        <div class="comparison-toggle">
          <button
            type="button"
            class="toggle-button ${this.selectionTarget === "primary" ? "toggle-active toggle-primary" : ""}"
            @click="${() => {
      this.selectionTarget = "primary";
    }}"
          >Primary Range</button>
          <button
            type="button"
            class="toggle-button ${this.selectionTarget === "comparison" ? "toggle-active toggle-comparison" : ""}"
            @click="${() => {
      this.selectionTarget = "comparison";
    }}"
          >Comparison Range</button>
        </div>
      ` : A}
      <div class="popup-body">
        ${this.effectivePresets.length > 0 ? b2`
            <div class="preset-sidebar">
              ${this.effectivePresets.map(
      (preset) => b2`
                <button
                  type="button"
                  class="preset-button"
                  ?disabled="${this.isPresetDisabled(preset)}"
                  @click="${() => this.handlePresetSelect(preset)}"
                >${preset.label}</button>
              `
    )}
            </div>
          ` : A}
        <div
          class="calendars-wrapper ${this.isDragging ? "dragging" : ""}"
          @mouseleave="${this.clearHoverPreview}"
        >
          <lui-calendar
            display-month="${leftDisplayMonth}"
            hide-navigation
            .renderDay="${this.renderRangeDay}"
            .locale="${this.effectiveLocale}"
            min-date="${this.minDate || A}"
            max-date="${this.maxDate || A}"
            @change="${this.handleCalendarSelect}"
          ></lui-calendar>
          <lui-calendar
            display-month="${rightDisplayMonth}"
            hide-navigation
            .renderDay="${this.renderRangeDay}"
            .locale="${this.effectiveLocale}"
            min-date="${this.minDate || A}"
            max-date="${this.maxDate || A}"
            @change="${this.handleCalendarSelect}"
          ></lui-calendar>
        </div>
      </div>
      <div class="popup-footer">
        <span class="footer-status">${this.durationText || this.selectionStatus}</span>
        ${this.rangeState === "complete" || this.comparison && this.compareRangeState === "complete" ? b2`
              <button
                type="button"
                class="footer-clear-button"
                @click=${this.handleClear}
              >Clear</button>
            ` : A}
      </div>
    `;
  }
  render() {
    return b2`
      <div class="date-range-wrapper">
        ${this.label ? b2`
              <label
                for=${this.inputId}
                class="date-range-label"
              >
                ${this.label}
                ${this.required ? b2`<span class="required-indicator">*</span>` : A}
              </label>
            ` : A}

        <div
          class="input-container ${this.hasError ? "container-error" : ""} ${this.disabled ? "container-disabled" : ""}"
          @click="${this.openPopup}"
        >
          <input
            id=${this.inputId}
            type="text"
            .value=${this.displayValue}
            placeholder=${this.effectivePlaceholder}
            readonly
            ?disabled=${this.disabled}
            aria-invalid=${this.hasError ? "true" : A}
            aria-errormessage=${this.hasError ? `${this.inputId}-error` : A}
            aria-describedby=${this.hasError ? `${this.inputId}-error` : this.helperText ? `${this.inputId}-helper` : A}
            aria-label=${!this.label ? "Date range" : A}
            aria-disabled=${this.disabled ? "true" : A}
          />

          ${this.startDate && !this.disabled ? b2`
                <button
                  type="button"
                  class="action-button"
                  aria-label="Clear date range"
                  @click=${this.handleClear}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
                    ${this.clearIcon}
                  </svg>
                </button>
              ` : A}

          <button
            type="button"
            class="action-button"
            aria-label="Open calendar"
            ?disabled=${this.disabled}
            @click=${(e7) => {
      e7.stopPropagation();
      this.togglePopup();
    }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
              ${this.calendarIcon}
            </svg>
          </button>
        </div>

        ${this.helperText && !this.hasError ? b2`
              <span
                id="${this.inputId}-helper"
                class="helper-text"
              >${this.helperText}</span>
            ` : A}

        ${this.hasError && this.displayError ? b2`
              <span
                id="${this.inputId}-error"
                class="error-text"
                role="alert"
              >${this.displayError}</span>
            ` : A}

        ${this.isOpen ? b2`
              <div
                class="popup"
                popover="manual"
                role="dialog"
                aria-modal="true"
                aria-label="Choose date range"
                @keydown=${this.handlePopupKeydown}
                @pointerup=${this.handleDragCancel}
              >
                ${this.renderCalendarContent()}
              </div>
            ` : A}
      </div>
    `;
  }
};
__decorateClass([
  e5(".input-container")
], DateRangePicker.prototype, "inputContainerEl", 2);
__decorateClass([
  e5(".popup")
], DateRangePicker.prototype, "popupEl", 2);
__decorateClass([
  e5("input")
], DateRangePicker.prototype, "inputEl", 2);
__decorateClass([
  n4({ type: String, reflect: true, attribute: "start-date" })
], DateRangePicker.prototype, "startDate", 2);
__decorateClass([
  n4({ type: String, reflect: true, attribute: "end-date" })
], DateRangePicker.prototype, "endDate", 2);
__decorateClass([
  n4({ type: String })
], DateRangePicker.prototype, "name", 2);
__decorateClass([
  n4({ type: String })
], DateRangePicker.prototype, "locale", 2);
__decorateClass([
  n4({ type: String })
], DateRangePicker.prototype, "placeholder", 2);
__decorateClass([
  n4({ type: String })
], DateRangePicker.prototype, "label", 2);
__decorateClass([
  n4({ type: String, attribute: "helper-text" })
], DateRangePicker.prototype, "helperText", 2);
__decorateClass([
  n4({ type: String, attribute: "min-date" })
], DateRangePicker.prototype, "minDate", 2);
__decorateClass([
  n4({ type: String, attribute: "max-date" })
], DateRangePicker.prototype, "maxDate", 2);
__decorateClass([
  n4({ type: Number, attribute: "min-days" })
], DateRangePicker.prototype, "minDays", 2);
__decorateClass([
  n4({ type: Number, attribute: "max-days" })
], DateRangePicker.prototype, "maxDays", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], DateRangePicker.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], DateRangePicker.prototype, "disabled", 2);
__decorateClass([
  n4({ type: String })
], DateRangePicker.prototype, "error", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], DateRangePicker.prototype, "comparison", 2);
__decorateClass([
  n4({ type: String, reflect: true, attribute: "compare-start-date" })
], DateRangePicker.prototype, "compareStartDate", 2);
__decorateClass([
  n4({ type: String, reflect: true, attribute: "compare-end-date" })
], DateRangePicker.prototype, "compareEndDate", 2);
__decorateClass([
  n4({
    converter: {
      fromAttribute: () => true
    }
  })
], DateRangePicker.prototype, "presets", 2);
__decorateClass([
  r5()
], DateRangePicker.prototype, "rangeState", 2);
__decorateClass([
  r5()
], DateRangePicker.prototype, "hoveredDate", 2);
__decorateClass([
  r5()
], DateRangePicker.prototype, "isOpen", 2);
__decorateClass([
  r5()
], DateRangePicker.prototype, "currentMonth", 2);
__decorateClass([
  r5()
], DateRangePicker.prototype, "internalError", 2);
__decorateClass([
  r5()
], DateRangePicker.prototype, "isDragging", 2);
__decorateClass([
  r5()
], DateRangePicker.prototype, "selectionTarget", 2);
__decorateClass([
  r5()
], DateRangePicker.prototype, "compareRangeState", 2);
if (!customElements.get("lui-date-range-picker")) {
  customElements.define("lui-date-range-picker", DateRangePicker);
}

// src/components/ui/time-utils.ts
function parseTimeISO(value) {
  const match2 = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match2) return null;
  const hour = parseInt(match2[1], 10);
  const minute = parseInt(match2[2], 10);
  const second = match2[3] ? parseInt(match2[3], 10) : 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    return null;
  }
  return { hour, minute, second };
}
function timeToISO(time) {
  const h4 = String(time.hour).padStart(2, "0");
  const m3 = String(time.minute).padStart(2, "0");
  const s5 = String(time.second).padStart(2, "0");
  return `${h4}:${m3}:${s5}`;
}
function isEndTimeAfterStart(startValue, endValue, allowOvernight = false) {
  const start = parseTimeISO(startValue);
  const end = parseTimeISO(endValue);
  if (!start || !end) return true;
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;
  if (allowOvernight) {
    return startMinutes !== endMinutes;
  }
  return endMinutes > startMinutes;
}
function getDefaultHourCycle(locale) {
  try {
    const resolved = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions();
    return resolved.hourCycle === "h11" || resolved.hourCycle === "h12" ? "h12" : "h23";
  } catch {
    return "h12";
  }
}
function formatTimeForDisplay(time, locale, hour12) {
  const date = new Date(2e3, 0, 1, time.hour, time.minute, time.second);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12
  }).format(date);
}

// src/components/ui/time-presets.ts
var DEFAULT_TIME_PRESETS = [
  { label: "Morning", resolve: () => ({ hour: 9, minute: 0, second: 0 }) },
  { label: "Afternoon", resolve: () => ({ hour: 14, minute: 0, second: 0 }) },
  { label: "Evening", resolve: () => ({ hour: 18, minute: 0, second: 0 }) }
];
function resolveNow() {
  const now = /* @__PURE__ */ new Date();
  return { hour: now.getHours(), minute: now.getMinutes(), second: 0 };
}

// src/components/ui/time-picker.ts
var TimePicker = class extends TailwindElement {
  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------
  constructor() {
    super();
    /**
     * ElementInternals for form participation.
     * Null during SSR since attachInternals() is not available.
     */
    this.internals = null;
    /**
     * Unique ID for accessibility associations.
     */
    this.pickerId = `lui-time-picker-${Math.random().toString(36).substr(2, 9)}`;
    // ---------------------------------------------------------------------------
    // SVG Icons
    // ---------------------------------------------------------------------------
    this.clockIcon = w`
    <circle cx="12" cy="12" r="10"
            stroke="currentColor" stroke-width="2" fill="none"/>
    <polyline points="12 6 12 12 16 14"
              stroke="currentColor" stroke-width="2" fill="none"
              stroke-linecap="round" stroke-linejoin="round"/>
  `;
    this.value = "";
    this.name = "";
    this.label = "";
    this.placeholder = "Select time";
    this.required = false;
    this.disabled = false;
    this.readonly = false;
    this.hour12 = void 0;
    this.locale = "en-US";
    this.step = 30;
    this.minTime = "";
    this.maxTime = "";
    this.allowOvernight = false;
    this.showTimezone = false;
    this.timezone = "";
    this.presets = false;
    this.interfaceMode = "both";
    this.businessHours = false;
    this.additionalTimezones = [];
    this.voice = false;
    this.isOpen = false;
    this.internalValue = null;
    this.activeInterface = "clock";
    this.clockMode = "hour";
    this.internalError = "";
    this.touched = false;
    // ---------------------------------------------------------------------------
    // Click-outside detection
    // ---------------------------------------------------------------------------
    /**
     * Handle document pointer events for closing popup when clicking outside.
     * Uses composedPath() to work correctly with Shadow DOM boundaries.
     */
    this.handleDocumentPointerDown = (e7) => {
      if (this.isOpen && !e7.composedPath().includes(this)) {
        this.closePopup();
      }
    };
    if (!o5) {
      this.internals = this.attachInternals();
    }
  }
  static {
    /**
     * Enable form association for this custom element.
     */
    this.formAssociated = true;
  }
  static {
    // ---------------------------------------------------------------------------
    // Styles
    // ---------------------------------------------------------------------------
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: inline-block;
        width: 100%;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      .time-picker-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        position: relative;
      }

      .time-picker-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--ui-time-picker-label-text, var(--ui-input-text, inherit));
      }

      .required-indicator {
        color: var(--ui-time-picker-error, var(--ui-input-text-error));
        margin-left: 0.125rem;
      }

      .input-display {
        display: flex;
        align-items: center;
        border-radius: var(--ui-time-picker-radius, var(--ui-input-radius, 0.375rem));
        border-width: var(--ui-time-picker-border-width, var(--ui-input-border-width, 1px));
        border-style: solid;
        border-color: var(--ui-time-picker-border, var(--ui-input-border));
        background-color: var(--ui-time-picker-bg, var(--ui-input-bg));
        transition:
          border-color 150ms,
          box-shadow 150ms;
        cursor: pointer;
      }

      .input-display:focus-within {
        border-color: var(--ui-time-picker-border-focus, var(--ui-input-border-focus));
      }

      .input-display.has-error {
        border-color: var(--ui-time-picker-error, var(--ui-input-border-error));
      }

      .input-display.is-disabled {
        background-color: var(--ui-time-picker-bg-disabled, var(--ui-input-bg-disabled));
        border-color: var(--ui-time-picker-border-disabled, var(--ui-input-border-disabled));
        cursor: not-allowed;
      }

      .display-text {
        flex: 1;
        min-width: 0;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        color: var(--ui-time-picker-text, var(--ui-input-text, inherit));
        user-select: none;
      }

      .display-text.is-placeholder {
        color: var(--ui-time-picker-placeholder, var(--ui-input-placeholder));
      }

      .timezone-label {
        font-size: 0.75rem;
        color: var(--ui-time-picker-timezone-text, var(--ui-input-placeholder));
        padding-right: 0.25rem;
        white-space: nowrap;
      }

      .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        margin-right: 0.25rem;
        border: none;
        background: transparent;
        color: var(--color-muted-foreground, var(--ui-time-picker-muted-text));
        cursor: pointer;
        border-radius: 0.25rem;
        transition:
          color 150ms,
          background-color 150ms;
      }

      .action-button:hover {
        color: var(--ui-time-picker-text, var(--ui-input-text, inherit));
        background-color: var(--color-muted, var(--ui-time-picker-hover-bg));
      }

      .action-button:focus-visible {
        outline: 2px solid var(--color-ring, var(--ui-time-picker-ring));
        outline-offset: 1px;
      }

      .action-icon {
        width: 1.25em;
        height: 1.25em;
      }

      .time-picker-popup {
        position: fixed;
        z-index: var(--ui-time-picker-z-index);
        background-color: var(--ui-time-picker-popup-bg);
        border: 1px solid var(--ui-time-picker-popup-border);
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 260px;
      }

      .interface-tabs {
        display: flex;
        gap: 0.25rem;
        border-bottom: 1px solid var(--ui-time-picker-popup-border);
        padding-bottom: 0.5rem;
      }

      .interface-tab {
        flex: 1;
        padding: 0.375rem 0.5rem;
        font-size: 0.75rem;
        border: 1px solid var(--ui-time-picker-border);
        border-radius: 0.25rem;
        background: var(--ui-time-picker-tab-bg);
        color: var(--ui-time-picker-text, inherit);
        cursor: pointer;
        transition: background-color 150ms, border-color 150ms;
        text-align: center;
      }

      .interface-tab:hover {
        background: var(--ui-time-picker-tab-bg-hover);
      }

      .interface-tab[aria-selected='true'] {
        background: var(--ui-time-picker-primary, var(--color-primary, var(--ui-color-primary)));
        color: white;
        border-color: var(--ui-time-picker-primary, var(--color-primary, var(--ui-color-primary)));
      }

      .interface-tab:focus-visible {
        outline: 2px solid var(--color-ring, var(--ui-time-picker-ring));
        outline-offset: 1px;
      }

      .preset-buttons {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
      }

      .preset-btn {
        flex: 1;
        padding: 0.375rem 0.5rem;
        font-size: 0.75rem;
        border: 1px solid var(--ui-time-picker-preset-border);
        border-radius: 0.25rem;
        background: var(--ui-time-picker-preset-bg);
        color: var(--ui-time-picker-preset-text, inherit);
        cursor: pointer;
        transition: background-color 150ms, border-color 150ms;
        white-space: nowrap;
      }

      .preset-btn:hover:not(:disabled) {
        background: var(--ui-time-picker-preset-bg-hover);
        border-color: var(--ui-time-picker-preset-border-hover);
      }

      .preset-btn:focus-visible {
        outline: 2px solid var(--color-ring, var(--ui-time-picker-ring));
        outline-offset: 1px;
      }

      .preset-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .now-btn {
        background: var(--ui-time-picker-primary, var(--color-primary, var(--ui-color-primary)));
        color: white;
        border-color: var(--ui-time-picker-primary, var(--color-primary, var(--ui-color-primary)));
      }

      .now-btn:hover:not(:disabled) {
        opacity: 0.9;
        background: var(--ui-time-picker-primary, var(--color-primary, var(--ui-color-primary)));
        border-color: var(--ui-time-picker-primary, var(--color-primary, var(--ui-color-primary)));
      }

      .error-message {
        font-size: 0.75rem;
        color: var(--ui-time-picker-error, var(--ui-input-text-error));
      }

    `
    ];
  }
  // ---------------------------------------------------------------------------
  // Computed getters
  // ---------------------------------------------------------------------------
  /**
   * Effective hour12 setting, auto-detected from locale if not explicitly set.
   */
  get effectiveHour12() {
    if (this.hour12 !== void 0) return this.hour12;
    return getDefaultHourCycle(this.locale) === "h12";
  }
  /**
   * Formatted time string for display in the input.
   */
  get displayValue() {
    if (!this.internalValue) return "";
    return formatTimeForDisplay(this.internalValue, this.locale, this.effectiveHour12);
  }
  /**
   * Timezone label text (e.g., "EST", "PST").
   */
  get timezoneLabel() {
    if (!this.showTimezone) return "";
    try {
      const options = {
        timeZoneName: "short",
        hour: "numeric"
      };
      if (this.timezone) {
        options.timeZone = this.timezone;
      }
      const parts = new Intl.DateTimeFormat(this.locale, options).formatToParts(/* @__PURE__ */ new Date());
      const tzPart = parts.find((p4) => p4.type === "timeZoneName");
      return tzPart?.value ?? "";
    } catch {
      return "";
    }
  }
  /**
   * Whether the component is in an error state.
   */
  get hasError() {
    return !!(this.touched && this.internalError);
  }
  /**
   * Resolved preset array based on the presets property value.
   */
  get effectivePresets() {
    if (this.presets === true) return DEFAULT_TIME_PRESETS;
    if (Array.isArray(this.presets)) return this.presets;
    return [];
  }
  /**
   * Whether presets should be shown (Now button + preset list).
   */
  get showPresets() {
    return this.presets === true || Array.isArray(this.presets) && this.presets.length > 0;
  }
  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has("value")) {
      if (this.value) {
        this.internalValue = parseTimeISO(this.value);
      } else {
        this.internalValue = null;
      }
      this.updateFormValue();
      this.validate();
    }
  }
  connectedCallback() {
    super.connectedCallback();
    if (!o5) {
      document.addEventListener("pointerdown", this.handleDocumentPointerDown);
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (!o5) {
      document.removeEventListener("pointerdown", this.handleDocumentPointerDown);
    }
  }
  // ---------------------------------------------------------------------------
  // Popup management
  // ---------------------------------------------------------------------------
  /**
   * Open the popup and position it via Floating UI.
   */
  async openPopup() {
    if (this.disabled || this.readonly) return;
    this.isOpen = true;
    this.clockMode = "hour";
    await this.updateComplete;
    this.positionPopup();
    requestAnimationFrame(() => {
      this.focusTimeInput();
    });
  }
  /**
   * Close the popup and restore focus to the toggle button.
   * Marks the component as touched for validation display.
   */
  closePopup() {
    this.isOpen = false;
    this.touched = true;
    requestAnimationFrame(() => {
      this.toggleBtnEl?.focus();
    });
  }
  /**
   * Toggle the popup open/close.
   */
  togglePopup() {
    if (this.isOpen) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }
  /**
   * Position the popup using Floating UI with flip/shift middleware.
   * Uses fixed strategy to avoid clipping in scrollable containers.
   */
  async positionPopup() {
    if (o5) return;
    if (!this.inputDisplayEl || !this.popupEl) return;
    const { x: x2, y: y3 } = await computePosition2(this.inputDisplayEl, this.popupEl, {
      placement: "bottom-start",
      strategy: "fixed",
      middleware: [
        offset2(4),
        flip2({ fallbackPlacements: ["top-start"] }),
        shift2({ padding: 8 })
      ]
    });
    Object.assign(this.popupEl.style, {
      left: `${x2}px`,
      top: `${y3}px`
    });
  }
  /**
   * Focus the hour spinbutton inside the TimeInput component.
   */
  focusTimeInput() {
    const timeInput = this.shadowRoot?.querySelector("lui-time-input");
    if (timeInput?.shadowRoot) {
      const hourSpinbutton = timeInput.shadowRoot.querySelector('[role="spinbutton"]');
      hourSpinbutton?.focus();
    }
  }
  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  /**
   * Handle click on the input display area.
   */
  handleDisplayClick() {
    if (!this.isOpen) {
      this.openPopup();
    }
  }
  /**
   * Handle time-input value changes from the spinbuttons.
   */
  handleTimeInputChange(e7) {
    const detail = e7.detail;
    if (!detail?.value) return;
    this.internalValue = detail.value;
    this.syncValueFromInternal();
  }
  /**
   * Handle clock face selection events.
   * In hour mode: set hour, switch to minute mode.
   * In minute mode: set minute and close popup.
   */
  handleClockSelect(e7) {
    const detail = e7.detail;
    if (!detail) return;
    const selectedValue = detail.value;
    const mode = detail.mode;
    const current = this.internalValue ?? { hour: 0, minute: 0, second: 0 };
    if (mode === "hour") {
      this.internalValue = { ...current, hour: selectedValue };
      this.clockMode = "minute";
      this.syncValueFromInternal();
    } else {
      this.internalValue = { ...current, minute: selectedValue };
      this.syncValueFromInternal();
      this.closePopup();
    }
  }
  /**
   * Handle dropdown time selection.
   */
  handleDropdownSelect(e7) {
    const detail = e7.detail;
    if (!detail?.value) return;
    this.internalValue = detail.value;
    this.syncValueFromInternal();
    this.closePopup();
  }
  /**
   * Handle clear button click: reset value.
   */
  handleClear(e7) {
    e7.stopPropagation();
    this.value = "";
    this.internalValue = null;
    this.internalError = "";
    this.updateFormValue();
    this.validate();
    dispatchCustomEvent(this, "change", {
      value: "",
      timeValue: null
    });
  }
  /**
   * Handle keyboard events on the popup.
   * Enter confirms and closes, Escape cancels and closes,
   * Tab is trapped within the popup for focus management.
   */
  handlePopupKeydown(e7) {
    if (e7.key === "Escape") {
      e7.preventDefault();
      this.closePopup();
    } else if (e7.key === "Enter") {
      const target = e7.target;
      const isButton = target.tagName === "BUTTON";
      if (!isButton) {
        e7.preventDefault();
        if (this.internalValue) {
          this.syncValueFromInternal();
        }
        this.closePopup();
      }
    } else if (e7.key === "Tab") {
      e7.preventDefault();
      this.focusTimeInput();
    }
  }
  /**
   * Select the current time via the Now button.
   */
  selectNow() {
    const now = resolveNow();
    this.internalValue = now;
    this.syncValueFromInternal();
    this.closePopup();
  }
  /**
   * Select a preset time value.
   */
  selectPreset(preset) {
    const resolved = preset.resolve();
    this.internalValue = resolved;
    this.syncValueFromInternal();
    this.closePopup();
  }
  /**
   * Handle scroll wheel value changes.
   */
  handleScrollWheelChange(e7) {
    const detail = e7.detail;
    if (!detail?.value) return;
    this.internalValue = detail.value;
    this.syncValueFromInternal();
  }
  /**
   * Handle voice input time selection.
   */
  handleVoiceSelect(e7) {
    const detail = e7.detail;
    if (!detail?.value) return;
    this.internalValue = detail.value;
    this.syncValueFromInternal();
    this.closePopup();
  }
  /**
   * Handle range slider value changes.
   */
  handleRangeChange(e7) {
    const detail = e7.detail;
    if (!detail) return;
    if (detail.startTime) {
      this.internalValue = detail.startTime;
      this.syncValueFromInternal();
    }
  }
  // ---------------------------------------------------------------------------
  // Value synchronization
  // ---------------------------------------------------------------------------
  /**
   * Sync the value string from the internal TimeValue.
   */
  syncValueFromInternal() {
    if (this.internalValue) {
      this.value = timeToISO(this.internalValue);
    } else {
      this.value = "";
    }
    this.updateFormValue();
    this.validate();
    dispatchCustomEvent(this, "change", {
      value: this.value,
      timeValue: this.internalValue
    });
  }
  // ---------------------------------------------------------------------------
  // Form integration
  // ---------------------------------------------------------------------------
  /**
   * Sync the current value to the form via ElementInternals.
   */
  updateFormValue() {
    this.internals?.setFormValue(this.value || null);
  }
  /**
   * Validate the current state and set validity on ElementInternals.
   */
  validate() {
    if (!this.internals) return true;
    const anchor = this.inputDisplayEl ?? void 0;
    if (this.required && !this.value) {
      this.internalError = "Please select a time";
      this.internals.setValidity(
        { valueMissing: true },
        this.internalError,
        anchor
      );
      return false;
    }
    if (this.value) {
      if (this.minTime) {
        const minParsed = parseTimeISO(this.minTime);
        const valParsed = parseTimeISO(this.value);
        if (minParsed && valParsed) {
          const minMinutes = minParsed.hour * 60 + minParsed.minute;
          const valMinutes = valParsed.hour * 60 + valParsed.minute;
          if (valMinutes < minMinutes) {
            const formatted = formatTimeForDisplay(minParsed, this.locale, this.effectiveHour12);
            this.internalError = `Time must be after ${formatted}`;
            this.internals.setValidity(
              { rangeUnderflow: true },
              this.internalError,
              anchor
            );
            return false;
          }
        }
      }
      if (this.maxTime) {
        const maxParsed = parseTimeISO(this.maxTime);
        const valParsed = parseTimeISO(this.value);
        if (maxParsed && valParsed) {
          const maxMinutes = maxParsed.hour * 60 + maxParsed.minute;
          const valMinutes = valParsed.hour * 60 + valParsed.minute;
          if (valMinutes > maxMinutes) {
            const formatted = formatTimeForDisplay(maxParsed, this.locale, this.effectiveHour12);
            this.internalError = `Time must be before ${formatted}`;
            this.internals.setValidity(
              { rangeOverflow: true },
              this.internalError,
              anchor
            );
            return false;
          }
        }
      }
      if (this.minTime && !isEndTimeAfterStart(this.minTime, this.value, this.allowOvernight)) {
        const minParsed = parseTimeISO(this.minTime);
        const formatted = minParsed ? formatTimeForDisplay(minParsed, this.locale, this.effectiveHour12) : this.minTime;
        this.internalError = `Time must be after ${formatted}`;
        this.internals.setValidity(
          { rangeUnderflow: true },
          this.internalError,
          anchor
        );
        return false;
      }
    }
    this.internalError = "";
    this.internals.setValidity({});
    return true;
  }
  /**
   * Form lifecycle callback: reset to initial state.
   */
  formResetCallback() {
    this.value = "";
    this.internalValue = null;
    this.internalError = "";
    this.touched = false;
    this.isOpen = false;
    this.internals?.setFormValue(null);
    this.internals?.setValidity({});
  }
  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled) {
    this.disabled = disabled;
  }
  /**
   * Form lifecycle callback: restore form state.
   */
  formStateRestoreCallback(state) {
    if (typeof state === "string") {
      this.value = state;
      this.internalValue = parseTimeISO(state);
    }
  }
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  render() {
    const showValue = this.displayValue;
    const hasValue = !!this.value && !this.readonly && !this.disabled;
    return b2`
      <div class="time-picker-wrapper">
        ${this.label ? b2`
              <label
                class="time-picker-label"
                id="${this.pickerId}-label"
              >
                ${this.label}
                ${this.required ? b2`<span class="required-indicator">*</span>` : A}
              </label>
            ` : A}

        <div
          class="input-display ${this.hasError ? "has-error" : ""} ${this.disabled ? "is-disabled" : ""}"
          @click=${this.handleDisplayClick}
          aria-labelledby=${this.label ? `${this.pickerId}-label` : A}
          aria-invalid=${this.hasError ? "true" : A}
        >
          <span class="display-text ${!showValue ? "is-placeholder" : ""}">
            ${showValue || this.placeholder}
          </span>

          ${this.showTimezone && this.timezoneLabel ? b2`<span class="timezone-label">${this.timezoneLabel}</span>` : A}

          ${hasValue ? b2`
                <button
                  type="button"
                  class="action-button clear-btn"
                  aria-label="Clear time"
                  @click=${this.handleClear}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
                    ${w`
                      <circle cx="12" cy="12" r="10"
                              stroke="currentColor" stroke-width="2" fill="none"/>
                      <line x1="15" y1="9" x2="9" y2="15"
                            stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round"/>
                      <line x1="9" y1="9" x2="15" y2="15"
                            stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round"/>
                    `}
                  </svg>
                </button>
              ` : A}

          <button
            type="button"
            class="action-button toggle-btn"
            aria-label="Toggle time picker"
            ?disabled=${this.disabled}
            @click=${(e7) => {
      e7.stopPropagation();
      this.togglePopup();
    }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
              ${this.clockIcon}
            </svg>
          </button>

          ${this.voice ? b2`
                <lui-time-voice-input
                  .locale=${this.locale}
                  ?disabled=${this.disabled || this.readonly}
                  @ui-voice-time-select=${this.handleVoiceSelect}
                ></lui-time-voice-input>
              ` : A}
        </div>

        ${this.hasError && this.internalError ? b2`
              <span
                class="error-message"
                role="alert"
              >${this.internalError}</span>
            ` : A}

        ${this.isOpen ? b2`
              <div
                class="time-picker-popup"
                role="dialog"
                aria-modal="true"
                aria-label="Select time"
                @keydown=${this.handlePopupKeydown}
              >
                <lui-time-input
                  .value=${this.internalValue}
                  .hour12=${this.effectiveHour12}
                  ?disabled=${this.disabled}
                  ?readonly=${this.readonly}
                  @ui-time-input-change=${this.handleTimeInputChange}
                ></lui-time-input>

                ${this.renderInterfaceTabs()}
                ${this.renderActiveInterface()}
                ${this.renderPresets()}
                ${this.additionalTimezones.length > 0 ? b2`
                      <lui-timezone-display
                        .value=${this.internalValue}
                        .locale=${this.locale}
                        .hour12=${this.effectiveHour12}
                        .primaryTimezone=${this.timezone}
                        .additionalTimezones=${this.additionalTimezones}
                      ></lui-timezone-display>
                    ` : A}
              </div>
            ` : A}
      </div>
    `;
  }
  /**
   * Render interface tabs when both clock and dropdown are available.
   */
  renderInterfaceTabs() {
    if (this.interfaceMode !== "both") return A;
    return b2`
      <div class="interface-tabs" role="tablist">
        <button
          type="button"
          class="interface-tab"
          role="tab"
          aria-selected=${this.activeInterface === "clock" ? "true" : "false"}
          @click=${() => {
      this.activeInterface = "clock";
    }}
        >Clock</button>
        <button
          type="button"
          class="interface-tab"
          role="tab"
          aria-selected=${this.activeInterface === "dropdown" ? "true" : "false"}
          @click=${() => {
      this.activeInterface = "dropdown";
    }}
        >List</button>
      </div>
    `;
  }
  /**
   * Render the active interface (clock face or dropdown).
   */
  renderActiveInterface() {
    const showWheel = this.interfaceMode === "wheel";
    const showRange = this.interfaceMode === "range";
    const showClock = this.interfaceMode === "clock" || this.interfaceMode === "both" && this.activeInterface === "clock";
    const showDropdown = this.interfaceMode === "dropdown" || this.interfaceMode === "both" && this.activeInterface === "dropdown";
    if (showWheel) {
      return b2`
        <lui-time-scroll-wheel
          .value=${this.internalValue}
          .hour12=${this.effectiveHour12}
          .step=${this.step}
          ?disabled=${this.disabled}
          @ui-scroll-wheel-change=${this.handleScrollWheelChange}
        ></lui-time-scroll-wheel>
      `;
    }
    if (showRange) {
      return b2`
        <lui-time-range-slider
          .startMinutes=${this.internalValue ? this.internalValue.hour * 60 + this.internalValue.minute : 540}
          .endMinutes=${1020}
          .step=${this.step}
          .hour12=${this.effectiveHour12}
          .locale=${this.locale}
          ?disabled=${this.disabled}
          @ui-time-range-change=${this.handleRangeChange}
        ></lui-time-range-slider>
      `;
    }
    if (showClock) {
      return b2`
        <lui-clock-face
          .mode=${this.clockMode}
          .hour=${this.internalValue?.hour ?? 0}
          .minute=${this.internalValue?.minute ?? 0}
          .hour12=${this.effectiveHour12}
          .step=${this.step}
          .businessHours=${this.businessHours}
          ?disabled=${this.disabled}
          @clock-select=${this.handleClockSelect}
        ></lui-clock-face>
      `;
    }
    if (showDropdown) {
      return b2`
        <lui-time-dropdown
          .value=${this.internalValue}
          .step=${this.step}
          .hour12=${this.effectiveHour12}
          .locale=${this.locale}
          .minTime=${this.minTime}
          .maxTime=${this.maxTime}
          .businessHours=${this.businessHours}
          ?disabled=${this.disabled}
          @ui-time-dropdown-select=${this.handleDropdownSelect}
        ></lui-time-dropdown>
      `;
    }
    return A;
  }
  /**
   * Render preset buttons (Now + configured presets).
   */
  renderPresets() {
    if (!this.showPresets) return A;
    const presetList = this.effectivePresets;
    return b2`
      <div class="preset-buttons">
        <button
          type="button"
          class="preset-btn now-btn"
          ?disabled=${this.disabled || this.readonly}
          @click=${this.selectNow}
        >Now</button>
        ${presetList.map(
      (preset) => b2`
            <button
              type="button"
              class="preset-btn"
              ?disabled=${this.disabled || this.readonly}
              @click=${() => this.selectPreset(preset)}
            >${preset.label}</button>
          `
    )}
      </div>
    `;
  }
};
__decorateClass([
  e5(".input-display")
], TimePicker.prototype, "inputDisplayEl", 2);
__decorateClass([
  e5(".time-picker-popup")
], TimePicker.prototype, "popupEl", 2);
__decorateClass([
  e5(".toggle-btn")
], TimePicker.prototype, "toggleBtnEl", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], TimePicker.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], TimePicker.prototype, "name", 2);
__decorateClass([
  n4({ type: String })
], TimePicker.prototype, "label", 2);
__decorateClass([
  n4({ type: String })
], TimePicker.prototype, "placeholder", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], TimePicker.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], TimePicker.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], TimePicker.prototype, "readonly", 2);
__decorateClass([
  n4({ type: Boolean, attribute: "hour12" })
], TimePicker.prototype, "hour12", 2);
__decorateClass([
  n4({ type: String })
], TimePicker.prototype, "locale", 2);
__decorateClass([
  n4({ type: Number })
], TimePicker.prototype, "step", 2);
__decorateClass([
  n4({ type: String, attribute: "min-time" })
], TimePicker.prototype, "minTime", 2);
__decorateClass([
  n4({ type: String, attribute: "max-time" })
], TimePicker.prototype, "maxTime", 2);
__decorateClass([
  n4({ type: Boolean, attribute: "allow-overnight" })
], TimePicker.prototype, "allowOvernight", 2);
__decorateClass([
  n4({ type: Boolean, attribute: "show-timezone" })
], TimePicker.prototype, "showTimezone", 2);
__decorateClass([
  n4({ type: String })
], TimePicker.prototype, "timezone", 2);
__decorateClass([
  n4({
    converter: {
      fromAttribute: () => true
    }
  })
], TimePicker.prototype, "presets", 2);
__decorateClass([
  n4({ type: String, attribute: "interface-mode" })
], TimePicker.prototype, "interfaceMode", 2);
__decorateClass([
  n4({ attribute: false })
], TimePicker.prototype, "businessHours", 2);
__decorateClass([
  n4({
    attribute: "additional-timezones",
    converter: {
      fromAttribute: (value) => value ? value.split(",").map((s5) => s5.trim()).filter(Boolean) : []
    }
  })
], TimePicker.prototype, "additionalTimezones", 2);
__decorateClass([
  n4({ type: Boolean })
], TimePicker.prototype, "voice", 2);
__decorateClass([
  r5()
], TimePicker.prototype, "isOpen", 2);
__decorateClass([
  r5()
], TimePicker.prototype, "internalValue", 2);
__decorateClass([
  r5()
], TimePicker.prototype, "activeInterface", 2);
__decorateClass([
  r5()
], TimePicker.prototype, "clockMode", 2);
__decorateClass([
  r5()
], TimePicker.prototype, "internalError", 2);
__decorateClass([
  r5()
], TimePicker.prototype, "touched", 2);

// src/components/ui/option.ts
var Option = class extends TailwindElement {
  constructor() {
    super(...arguments);
    this.value = "";
    this.label = "";
    this.disabled = false;
    this.selected = false;
    this.multiselect = false;
    /**
     * Unique ID for aria-activedescendant reference.
     */
    this.optionId = `lui-option-${Math.random().toString(36).substr(2, 9)}`;
  }
  static {
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      .option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: var(--ui-select-option-padding-y, 0.5rem)
          var(--ui-select-option-padding-x, 0.75rem);
        cursor: pointer;
        color: var(--ui-select-option-text);
        background-color: transparent;
        transition: background-color 150ms;
      }

      .option:hover:not(.option-disabled) {
        background-color: var(--ui-select-option-bg-hover);
      }

      .option-active {
        background-color: var(--ui-select-option-bg-active);
      }

      .option-selected {
        color: var(--ui-select-option-text-selected);
        font-weight: 500;
      }

      .option-disabled {
        color: var(--ui-select-option-text-disabled);
        cursor: not-allowed;
        opacity: 0.5;
      }

      .check-icon {
        width: 1em;
        height: 1em;
        flex-shrink: 0;
        color: var(--ui-select-option-check);
        display: none;
      }

      .option-selected .check-icon {
        display: block;
      }

      /* Checkbox indicator for multi-select mode */
      .checkbox-indicator {
        width: 1em;
        height: 1em;
        flex-shrink: 0;
        border: 2px solid var(--ui-select-checkbox-border, var(--color-border));
        border-radius: var(--radius-sm, 0.25rem);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 0.5rem;
        background-color: transparent;
        transition:
          background-color 150ms,
          border-color 150ms;
      }

      .checkbox-indicator.checked {
        background-color: var(
          --ui-select-checkbox-bg-checked,
          var(--color-primary)
        );
        border-color: var(
          --ui-select-checkbox-bg-checked,
          var(--color-primary)
        );
      }

      .checkbox-indicator svg {
        width: 0.75em;
        height: 0.75em;
        color: var(--ui-select-checkbox-check, white);
      }

      .slot-start,
      .slot-end {
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }

      .option-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .option-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      ::slotted([slot='start']),
      ::slotted([slot='end']) {
        width: 1.25em;
        height: 1.25em;
      }

      ::slotted([slot='description']) {
        font-size: 0.75rem;
        color: var(--ui-select-option-text-disabled);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `
    ];
  }
  /**
   * Get the unique ID for this option (for aria-activedescendant).
   */
  getId() {
    return this.optionId;
  }
  /**
   * Get the display label for this option.
   * Priority: label property > textContent > value
   */
  getLabel() {
    return this.label || this.textContent?.trim() || this.value;
  }
  /**
   * Render the selection indicator based on multiselect mode.
   * Shows checkbox in multi-select, checkmark in single-select.
   */
  renderSelectionIndicator() {
    if (this.multiselect) {
      return b2`
        <span class="checkbox-indicator ${this.selected ? "checked" : ""}">
          ${this.selected ? b2`
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path
                    d="M3 8l4 4 6-7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                  />
                </svg>
              ` : A}
        </span>
      `;
    }
    return b2`
      <svg
        class="check-icon"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          d="M3 8l4 4 6-7"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }
  render() {
    const classes = ["option"];
    if (this.disabled) classes.push("option-disabled");
    if (this.selected) classes.push("option-selected");
    return b2`
      <div
        id=${this.optionId}
        role="option"
        aria-selected=${this.selected ? "true" : "false"}
        aria-disabled=${this.disabled ? "true" : "false"}
        class=${classes.join(" ")}
      >
        ${this.renderSelectionIndicator()}
        <span class="slot-start"><slot name="start"></slot></span>
        <span class="option-content">
          <span class="option-label">${this.label || b2`<slot></slot>`}</span>
          <slot name="description"></slot>
        </span>
        <span class="slot-end"><slot name="end"></slot></span>
      </div>
    `;
  }
};
__decorateClass([
  n4({ type: String })
], Option.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], Option.prototype, "label", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Option.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Option.prototype, "selected", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], Option.prototype, "multiselect", 2);
if (!customElements.get("lui-option")) {
  customElements.define("lui-option", Option);
}

// src/components/ui/option-group.ts
var OptionGroup = class extends TailwindElement {
  constructor() {
    super(...arguments);
    this.label = "";
    /**
     * Unique ID for aria-labelledby reference.
     */
    this.groupId = `lui-option-group-${Math.random().toString(36).substr(2, 9)}`;
  }
  static {
    this.styles = [
      ...tailwindBaseStyles,
      i`
      :host {
        display: block;
      }

      /* Visual separator between groups (not on first group) */
      :host(:not(:first-child)) {
        border-top: 1px solid var(--ui-select-dropdown-border);
        margin-top: 0.25rem;
        padding-top: 0.25rem;
      }

      /* Group label styling - uppercase, smaller, muted */
      .group-label {
        padding: 0.375rem var(--ui-select-option-padding-x, 0.75rem);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ui-select-option-text-disabled);
        user-select: none;
        pointer-events: none;
      }

      /* Container for options */
      .group-content {
        display: block;
      }
    `
    ];
  }
  render() {
    return b2`
      <div role="group" aria-labelledby=${this.label ? this.groupId : A}>
        ${this.label ? b2`
              <div
                id=${this.groupId}
                class="group-label"
                role="presentation"
                aria-hidden="true"
              >
                ${this.label}
              </div>
            ` : A}
        <div class="group-content">
          <slot></slot>
        </div>
      </div>
    `;
  }
};
__decorateClass([
  n4({ type: String })
], OptionGroup.prototype, "label", 2);
if (!customElements.get("lui-option-group")) {
  customElements.define("lui-option-group", OptionGroup);
}
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
@lit/reactive-element/decorators/custom-element.js:
@lit/reactive-element/decorators/property.js:
@lit/reactive-element/decorators/state.js:
@lit/reactive-element/decorators/event-options.js:
@lit/reactive-element/decorators/base.js:
@lit/reactive-element/decorators/query.js:
@lit/reactive-element/decorators/query-all.js:
@lit/reactive-element/decorators/query-async.js:
@lit/reactive-element/decorators/query-assigned-nodes.js:
lit-html/directive.js:
lit-html/directives/repeat.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-elements.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/style-map.js:
  (**
   * @license
   * Copyright 2018 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive-helpers.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=bundle.js.map
