import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

interface CatalogEntry {
  key: string;
  module: string;
  valueEn: string;
  valueAr: string;
  valueZh: string;
}

const repoRoot = join(import.meta.dir, '..');
const srcRoot = join(repoRoot, 'src');
const outputPath = join(srcRoot, 'data/content-catalog.generated.ts');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory)
    .flatMap((name) => {
      const path = join(directory, name);
      return statSync(path).isDirectory() ? sourceFiles(path) : [path];
    })
    .filter((path) => /\.(tsx?|jsx?)$/.test(path))
    .filter((path) => !path.endsWith('content-catalog.generated.ts'));
}

function literalValue(node: ts.Expression | undefined) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text.trim();
  return undefined;
}

function moduleFromPath(path: string) {
  const sourcePath = relative(srcRoot, path).replaceAll('\\', '/');
  const parts = sourcePath.split('/');
  if (parts[0] === 'app') return parts[1]?.replace(/\[|\]/g, '') || 'home';
  if (parts[0] === 'components') return parts[1] || 'common';
  return parts[0] || 'common';
}

function localizedObjectValue(node: ts.ObjectLiteralExpression, propertyName: string) {
  const property = node.properties.find((candidate) => {
    if (!ts.isPropertyAssignment(candidate)) return false;
    const name = candidate.name;
    return (ts.isIdentifier(name) || ts.isStringLiteral(name)) && name.text === propertyName;
  });
  return property && ts.isPropertyAssignment(property)
    ? literalValue(property.initializer)
    : undefined;
}

function literalRecordFromVariable(path: string, variableName: string) {
  const sourceText = readFileSync(path, 'utf8');
  const sourceFile = ts.createSourceFile(path, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const values: Record<string, string> = {};

  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === variableName) {
      const initializer = node.initializer;
      if (initializer && ts.isObjectLiteralExpression(initializer)) {
        for (const property of initializer.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const key = ts.isStringLiteral(property.name) || ts.isIdentifier(property.name)
            ? property.name.text
            : undefined;
          const value = literalValue(property.initializer);
          if (key && value) values[key] = value;
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return values;
}

const zhFallbacks = literalRecordFromVariable(
  join(srcRoot, 'contexts/AppContext.tsx'),
  'zhTranslations'
);
const entries = new Map<string, CatalogEntry>();

for (const path of sourceFiles(srcRoot)) {
  const sourceText = readFileSync(path, 'utf8');
  const sourceFile = ts.createSourceFile(
    path,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 't'
    ) {
      const valueEn = literalValue(node.arguments[0]);
      const valueAr = literalValue(node.arguments[1]);
      const valueZh = literalValue(node.arguments[2]);

      if (valueEn && valueAr && !entries.has(valueEn)) {
        entries.set(valueEn, {
          key: valueEn,
          module: moduleFromPath(path),
          valueEn,
          valueAr,
          valueZh: valueZh || zhFallbacks[valueEn] || valueEn,
        });
      }
    }

    if (ts.isObjectLiteralExpression(node)) {
      const valueEn = localizedObjectValue(node, 'en');
      const valueAr = localizedObjectValue(node, 'ar');
      const valueZh = localizedObjectValue(node, 'zh');

      if (valueEn && valueAr && !entries.has(valueEn)) {
        entries.set(valueEn, {
          key: valueEn,
          module: moduleFromPath(path),
          valueEn,
          valueAr,
          valueZh: valueZh || zhFallbacks[valueEn] || valueEn,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

const manualEntries: CatalogEntry[] = [
  {
    key: 'whatsapp.orderCreated',
    module: 'whatsapp',
    valueEn: 'Al-Wasl Digital\nOrder {{orderId}} received.\nWAHO ID: {{wahoId}}.\nAmount: {{amount}}.\nWe will confirm the payment and keep you informed here.',
    valueAr: 'Al-Wasl Digital\nتم استلام الطلب {{orderId}}.\nمعرف WAHO: {{wahoId}}.\nالمبلغ: {{amount}}.\nسنؤكد الدفع ونبقيك على اطلاع هنا.',
    valueZh: 'Al-Wasl Digital\n已收到订单 {{orderId}}。\nWAHO ID：{{wahoId}}。\n金额：{{amount}}。\n我们会确认付款并在此通知您。',
  },
  {
    key: 'whatsapp.accountBlocked',
    module: 'whatsapp',
    valueEn: 'Al-Wasl Digital\nYour access has been blocked for this WhatsApp number.\nReason: {{reason}}.\nContact Al-Wasl support if you believe this is incorrect.',
    valueAr: 'Al-Wasl Digital\nتم حظر الوصول لرقم واتساب هذا.\nالسبب: {{reason}}.\nتواصل مع دعم الوصل إذا كنت تعتقد أن هذا غير صحيح.',
    valueZh: 'Al-Wasl Digital\n此 WhatsApp 号码的访问权限已被封锁。\n原因：{{reason}}。\n如有异议，请联系 Al-Wasl 支持。',
  },
];

for (const entry of manualEntries) entries.set(entry.key, entry);

const sortedEntries = [...entries.values()].sort((a, b) => (
  a.module.localeCompare(b.module) || a.key.localeCompare(b.key)
));
const generated = `// Generated by scripts/generate-content-catalog.ts. Do not edit manually.
export interface GeneratedContentCatalogEntry {
  key: string;
  module: string;
  valueEn: string;
  valueAr: string;
  valueZh: string;
}

export const generatedContentCatalog: GeneratedContentCatalogEntry[] = ${JSON.stringify(sortedEntries, null, 2)};
`;

writeFileSync(outputPath, generated);
console.log(`Generated ${sortedEntries.length} editable content entries.`);
