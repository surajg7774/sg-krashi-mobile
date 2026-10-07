#!/usr/bin/env node
// Finds hard-coded, user-facing English text in src/ (best effort, using the TypeScript parser already in
// devDependencies). Used for the i18n inventory (docs/I18N_INVENTORY.md) and for the leftover check after migration.
//
//   node scripts/i18n-scan.cjs            -> summary per feature + every finding
//   node scripts/i18n-scan.cjs --summary  -> summary only
//   node scripts/i18n-scan.cjs --json     -> machine-readable findings
//
// A line can opt out with a trailing `// i18n-ignore` comment (brand names, legal text kept in English, debug text).
// Not a proof: it reads the code, so it can miss text built at runtime and can flag a string that never reaches a
// screen. Treat the output as a review list.
/* global __dirname */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const args = new Set(process.argv.slice(2));

const SKIP_DIRS = new Set(["i18n"]);
const walk = (dir, out = []) => {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(p, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.d\.ts$/.test(name)) out.push(p);
  }
  return out;
};

// JSX props whose string value is shown to (or read out to) the user.
const UI_PROPS = new Set([
  "title", "label", "placeholder", "accessibilityLabel", "accessibilityHint", "subtitle", "message", "text",
  "headerTitle", "tabBarLabel", "emptyText", "buttonLabel", "actionLabel", "description", "hint", "helperText",
  "errorText", "error", "confirmText", "cancelText", "retryLabel", "body", "heading", "caption", "note",
]);
// JSX props that never carry user-facing text.
const NON_UI_PROPS = new Set([
  "testID", "keyboardType", "autoCapitalize", "autoComplete", "textContentType", "returnKeyType", "resizeMode",
  "pointerEvents", "contentFit", "accessibilityRole", "importantForAccessibility", "mode", "display", "behavior",
  "name", "source", "uri", "style", "color", "tintColor", "ellipsizeMode", "keyExtractor", "barStyle", "style",
  "inputMode", "enterKeyHint", "accessibilityLiveRegion", "transition", "cachePolicy", "presentation", "animation",
  "originWhitelist", "mixedContentMode", "dataDetectorType", "selectionColor", "placeholderTextColor", "role",
]);
// Object properties whose string value is shown to the user (navigation options, alert configs, local tables).
const UI_OBJECT_KEYS = new Set([...UI_PROPS, "headerBackTitle", "tabBarAccessibilityLabel", "cta", "detail", "hint"]);

const hasLetters = (s) => /[A-Za-z]{2,}/.test(s);
const looksLikeCode = (s) =>
  /^[a-z][A-Za-z0-9]*$/.test(s) || // camelCase identifier / single lowercase word
  /^[A-Z0-9_]+$/.test(s) || // CONSTANT_CASE / enum value
  /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(s) || // dotted keys, file names
  /^(https?:|\/|\.\/|@\/|#|data:|sgkrashi[.:])/.test(s) || // urls, paths, colours, storage keys
  /^[a-z-]+\/[a-z0-9.+-]+$/i.test(s) || // mime types
  /^[a-z]+(-[a-z0-9]+)+$/.test(s) || // kebab-case ids
  /^(YYYY|DD|HH)/.test(s); // date patterns
const looksLikeUiText = (s) => {
  const t = s.trim();
  if (!hasLetters(t) || looksLikeCode(t)) return false;
  return /\s/.test(t) || /^[A-Z][a-z]/.test(t) || /[.!?…:]$/.test(t);
};

const textOf = (node, sf) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return node.head.text + node.templateSpans.map((s) => "{…}" + s.literal.text).join("");
  return node.getText(sf);
};

const isIgnoredLine = (sf, node) => {
  const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  const lineText = sf.text.split(/\r?\n/)[line] || "";
  return /i18n-ignore/.test(lineText);
};

// Values that are code, not text: HTTP headers and developer-only assertions.
const NON_UI_TEXTS = [/^Authorization$/, /^Bearer /, /^Content-Type$/, /must be used within/];
// Calls whose string arguments are route names, storage keys or patterns - never text.
const NON_UI_CALLEES = /(^|\.)(navigate|push|replace|reset|getParent|setParams|jumpTo|dispatch|addListener|getItem|setItem|removeItem|includes|startsWith|endsWith|split|join|getNavigation)$/;
// Object keys whose value is a route name or other identifier.
const NON_UI_OBJECT_KEYS = new Set(["screen", "tab", "route", "icon", "initialRouteName", "routeName", "queryKey", "key", "id", "type", "status"]);

const insideNonUiCall = (node, sf) => {
  for (let p = node.parent; p && !ts.isSourceFile(p); p = p.parent) {
    if (ts.isCallExpression(p) && NON_UI_CALLEES.test(p.expression.getText(sf))) return true;
    if (ts.isJsxElement(p) || ts.isJsxSelfClosingElement(p) || ts.isBlock(p) || ts.isArrowFunction(p)) return false;
  }
  return false;
};

const findings = [];
const scanFile = (file) => {
  const code = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const add = (node, kind, text) => {
    if (isIgnoredLine(sf, node)) return;
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    findings.push({ file: rel, line: line + 1, kind, text: text.replace(/\s+/g, " ").trim() });
  };

  const visit = (node) => {
    // Never look inside imports/exports specifiers, type positions or console/require calls.
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isTypeNode(node)) return;
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(sf);
      if (/^console\.|^require$|^__DEV__/.test(callee)) return;
      if (/^Alert\.alert$/.test(callee)) {
        node.arguments.slice(0, 2).forEach((a) => {
          if (ts.isStringLiteralLike(a) || ts.isTemplateExpression(a)) add(a, "alert", textOf(a, sf));
        });
      }
    }

    if (ts.isJsxText(node)) {
      const t = node.getText(sf).trim();
      // Units stay as they are in every language (docs/I18N_DECISIONS.md, D3).
      if (hasLetters(t) && !/^(mm|°C|km|kg|%)$/.test(t)) add(node, "jsx-text", t);
      return;
    }

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) {
      const text = textOf(node, sf);
      const parent = node.parent;
      if (NON_UI_TEXTS.some((re) => re.test(text.trim())) || insideNonUiCall(node, sf)) return;
      // A message key ("auth.login.title") is a reference to translated text, not text.
      if (/^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)+$/.test(text)) return;
      // Already reported by the Alert.alert branch.
      if (ts.isCallExpression(parent) && parent.expression.getText(sf) === "Alert.alert" && parent.arguments.indexOf(node) < 2) return;
      // Comparisons, switch cases, object keys, element access: values, not text.
      if (ts.isBinaryExpression(parent) && /===|!==|==|!=/.test(parent.operatorToken.getText(sf))) return;
      if (ts.isCaseClause(parent) || ts.isElementAccessExpression(parent) || ts.isLiteralTypeNode(parent)) return;
      if (ts.isPropertyAssignment(parent) && parent.name === node) return;

      // JSX attribute value: decide by prop name.
      const attr = ts.isJsxAttribute(parent) ? parent : ts.isJsxExpression(parent) && ts.isJsxAttribute(parent.parent) ? parent.parent : null;
      if (attr) {
        const prop = attr.name.getText(sf);
        if (NON_UI_PROPS.has(prop)) return;
        if (UI_PROPS.has(prop) ? hasLetters(text) : looksLikeUiText(text)) add(node, "jsx-prop:" + prop, text);
        return;
      }
      // String inside JSX children expression, e.g. {cond ? "Yes" : "No"}.
      if (ts.isPropertyAssignment(parent)) {
        const key = parent.name.getText(sf).replace(/["']/g, "");
        if (NON_UI_OBJECT_KEYS.has(key)) return;
        if (UI_OBJECT_KEYS.has(key) ? hasLetters(text) : looksLikeUiText(text)) add(node, "object:" + key, text);
        return;
      }
      if (looksLikeUiText(text)) add(node, "string", text);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
};

const files = walk(path.join(root, "src")).concat([path.join(root, "App.tsx")]).filter((f) => fs.existsSync(f));
files.forEach(scanFile);

const featureOf = (file) => {
  const m = /^src\/features\/([^/]+)\//.exec(file);
  if (m) return "features/" + m[1];
  const n = /^src\/([^/]+)\//.exec(file);
  return n ? n[1] : file;
};

if (args.has("--json")) {
  process.stdout.write(JSON.stringify(findings, null, 2) + "\n");
  process.exit(0);
}
const byFeature = new Map();
for (const f of findings) {
  const k = featureOf(f.file);
  byFeature.set(k, (byFeature.get(k) || 0) + 1);
}
console.log("files scanned:", files.length, "| findings:", findings.length);
for (const [k, n] of [...byFeature].sort((a, b) => b[1] - a[1])) console.log(String(n).padStart(5), k);
if (!args.has("--summary")) {
  console.log("");
  for (const f of findings) console.log(`${f.file}:${f.line}  [${f.kind}]  ${f.text}`);
}
