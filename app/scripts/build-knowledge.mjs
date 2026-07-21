import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const knowledgeBaseDir = join(__dirname, '..', 'functions', 'src', 'knowledge');

const ALLOWED_DOMAINS = ['hypertrophy', 'programming', 'recovery', 'nutrition'];
const ALLOWED_EVIDENCE = ['strong', 'moderate', 'emerging'];

// Must stay in sync with MUSCLE_RANGES keys in app/functions/src/volumeTargets.ts
const ALLOWED_MUSCLES = [
  'chest',
  'front delts',
  'side delts',
  'rear delts',
  'biceps',
  'triceps',
  'forearms',
  'lats',
  'upper back',
  'traps',
  'lower back',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'abs',
  'obliques'
];

let items;
try {
  items = readdirSync(knowledgeBaseDir, { withFileTypes: true });
} catch (err) {
  console.error(`Error listing directory ${knowledgeBaseDir}:`, err);
  process.exit(1);
}

const subdirs = items.filter(item => item.isDirectory()).map(item => item.name);
const cards = [];
const seenIds = new Set();

for (const subdir of subdirs) {
  const domainDir = join(knowledgeBaseDir, subdir);
  let files;
  try {
    files = readdirSync(domainDir);
  } catch (err) {
    console.error(`Error listing directory ${domainDir}:`, err);
    process.exit(1);
  }

  for (const file of files) {
    if (extname(file) !== '.md') continue;
    const filePath = join(domainDir, file);

    let content;
    try {
      content = readFileSync(filePath, 'utf-8');
    } catch (err) {
      console.error(`Error reading file ${filePath}:`, err);
      process.exit(1);
    }

    // Normalize newlines to \n
    const normalized = content.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');

    if (lines[0] !== '---') {
      console.error(`Error in ${filePath}: File does not start with ---`);
      process.exit(1);
    }

    let closingIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        closingIndex = i;
        break;
      }
    }

    if (closingIndex === -1) {
      console.error(`Error in ${filePath}: Missing closing --- for frontmatter`);
      process.exit(1);
    }

    const frontmatterLines = lines.slice(1, closingIndex);
    const body = lines.slice(closingIndex + 1).join('\n').trim();

    const card = {
      id: '',
      title: '',
      domain: '',
      tags: [],
      muscles: [],
      evidence: '',
      sources: [],
    };

    let currentSource = null;

    for (const line of frontmatterLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('- ref:')) {
        let refVal = trimmed.slice('- ref:'.length).trim();
        if (refVal.startsWith('"') && refVal.endsWith('"')) {
          refVal = refVal.slice(1, -1);
        }
        currentSource = { ref: refVal, url: '' };
        card.sources.push(currentSource);
      } else if (trimmed.startsWith('url:')) {
        let urlVal = trimmed.slice('url:'.length).trim();
        if (urlVal.startsWith('"') && urlVal.endsWith('"')) {
          urlVal = urlVal.slice(1, -1);
        }
        if (currentSource) {
          currentSource.url = urlVal;
        } else {
          console.error(`Error in ${filePath}: url line found before any ref line`);
          process.exit(1);
        }
      } else {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
          console.error(`Error in ${filePath}: Invalid frontmatter line: ${line}`);
          process.exit(1);
        }
        const key = line.slice(0, colonIndex).trim();
        let val = line.slice(colonIndex + 1).trim();

        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }

        if (key === 'id') {
          card.id = val;
        } else if (key === 'title') {
          card.title = val;
        } else if (key === 'domain') {
          card.domain = val;
        } else if (key === 'evidence') {
          card.evidence = val;
        } else if (key === 'tags') {
          if (val.startsWith('[') && val.endsWith(']')) {
            val = val.slice(1, -1);
          }
          card.tags = val.split(',').map(t => t.trim()).filter(Boolean);
        } else if (key === 'muscles') {
          if (val.startsWith('[') && val.endsWith(']')) {
            val = val.slice(1, -1);
          }
          card.muscles = val.split(',').map(m => m.trim()).filter(Boolean);
        }
      }
    }

    // Validation
    const { id, title, domain, evidence, sources, muscles, tags } = card;

    if (!id) {
      console.error(`Error in ${filePath}: Missing or empty "id"`);
      process.exit(1);
    }
    if (seenIds.has(id)) {
      console.error(`Error in ${filePath}: Duplicate card ID found: ${id}`);
      process.exit(1);
    }
    seenIds.add(id);

    if (!title) {
      console.error(`Error in ${filePath}: Missing or empty "title"`);
      process.exit(1);
    }
    if (!domain) {
      console.error(`Error in ${filePath}: Missing or empty "domain"`);
      process.exit(1);
    }
    if (!evidence) {
      console.error(`Error in ${filePath}: Missing or empty "evidence"`);
      process.exit(1);
    }
    if (!body) {
      console.error(`Error in ${filePath}: Missing or empty "body"`);
      process.exit(1);
    }

    if (!ALLOWED_DOMAINS.includes(domain)) {
      console.error(`Error in ${filePath}: Invalid domain "${domain}". Must be one of: ${ALLOWED_DOMAINS.join(', ')}`);
      process.exit(1);
    }

    if (!ALLOWED_EVIDENCE.includes(evidence)) {
      console.error(`Error in ${filePath}: Invalid evidence level "${evidence}". Must be one of: ${ALLOWED_EVIDENCE.join(', ')}`);
      process.exit(1);
    }

    if (!sources || sources.length === 0) {
      console.error(`Error in ${filePath}: "sources" must contain at least one source`);
      process.exit(1);
    }

    for (let idx = 0; idx < sources.length; idx++) {
      const src = sources[idx];
      if (!src.ref) {
        console.error(`Error in ${filePath}: Source at index ${idx} is missing "ref"`);
        process.exit(1);
      }
      if (!src.url) {
        console.error(`Error in ${filePath}: Source at index ${idx} is missing "url"`);
        process.exit(1);
      }
    }

    for (const m of muscles) {
      if (m !== 'all' && !ALLOWED_MUSCLES.includes(m)) {
        console.error(`Error in ${filePath}: Invalid muscle "${m}". Must be "all" or a key of MUSCLE_RANGES`);
        process.exit(1);
      }
    }

    cards.push({
      id,
      title,
      domain,
      tags,
      muscles,
      evidence,
      sources,
      body,
    });
  }
}

// Sort cards by domain then id (stable output)
cards.sort((a, b) => {
  if (a.domain < b.domain) return -1;
  if (a.domain > b.domain) return 1;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
});

const outputFilePath = join(knowledgeBaseDir, '..', 'knowledge.json');
try {
  writeFileSync(outputFilePath, JSON.stringify(cards, null, 2), 'utf-8');
} catch (err) {
  console.error(`Error writing compiled knowledge cards:`, err);
  process.exit(1);
}

const domainCounts = {};
for (const domain of ALLOWED_DOMAINS) {
  domainCounts[domain] = 0;
}
for (const card of cards) {
  domainCounts[card.domain] = (domainCounts[card.domain] || 0) + 1;
}

console.log(`Successfully compiled knowledge cards!`);
console.log(`Total card count: ${cards.length}`);
console.log(`Breakdown by domain:`);
for (const domain of ALLOWED_DOMAINS) {
  console.log(`- ${domain}: ${domainCounts[domain]}`);
}
