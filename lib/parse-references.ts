import type { InputItem } from '@/lib/types';

const DOI_PATTERN = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi;
const ISBN_PATTERN = /\b97[89][- ]?(?:\d[- ]?){9}\d\b/g;
const URL_PATTERN = /https?:\/\/[^\s]+/gi;
const VIAF_PATTERN = /\bviaf[:/](\d+)\b/gi;
const ORCID_PATTERN = /\borcid[:/](\d{4}-\d{4}-\d{4}-\d{3}[\dX])\b/gi;
const ROR_PATTERN = /\bror[:/](0[0-9a-z]{6,})\b/gi;
const ISNI_PATTERN = /\bisni[:/](\d{15,16})\b/gi;

function normalizeIdentifier(value: string): string {
  return value.trim().replace(/[.,;:]+$/, '');
}

function inferKind(identifierType: InputItem['identifierType']): InputItem['kind'] {
  switch (identifierType) {
    case 'DOI':
      return 'doi';
    case 'ISBN':
      return 'book';
    case 'URL':
      return 'url';
    case 'VIAF':
    case 'ORCID':
    case 'ISNI':
      return 'author';
    case 'ROR':
      return 'institution';
    default:
      return 'url';
  }
}

function parseLine(line: string): InputItem | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const authors: string[] = [];
  const institutions: string[] = [];

  const viafMatches = trimmed.matchAll(VIAF_PATTERN);
  for (const match of viafMatches) {
    authors.push(`VIAF:${match[1]}`);
  }

  const orcidMatches = trimmed.matchAll(ORCID_PATTERN);
  for (const match of orcidMatches) {
    authors.push(`ORCID:${match[1]}`);
  }

  const rorMatches = trimmed.matchAll(ROR_PATTERN);
  for (const match of rorMatches) {
    institutions.push(`ROR:${match[1]}`);
  }

  const isniMatches = trimmed.matchAll(ISNI_PATTERN);
  for (const match of isniMatches) {
    authors.push(`ISNI:${match[1]}`);
  }

  const doiMatch = trimmed.match(DOI_PATTERN);
  if (doiMatch) {
    return {
      id: `doi:${doiMatch[0]}`,
      raw: trimmed,
      kind: 'doi',
      identifierType: 'DOI',
      identifier: normalizeIdentifier(doiMatch[0]),
      authors,
      institutions,
      label: trimmed,
    };
  }

  const isbnMatch = trimmed.match(ISBN_PATTERN);
  if (isbnMatch) {
    return {
      id: `isbn:${isbnMatch[0]}`,
      raw: trimmed,
      kind: 'book',
      identifierType: 'ISBN',
      identifier: normalizeIdentifier(isbnMatch[0].replace(/[- ]/g, '')),
      authors,
      institutions,
      label: trimmed,
    };
  }

  const urlMatch = trimmed.match(URL_PATTERN);
  if (urlMatch) {
    return {
      id: `url:${urlMatch[0]}`,
      raw: trimmed,
      kind: inferKind('URL'),
      identifierType: 'URL',
      identifier: normalizeIdentifier(urlMatch[0]),
      authors,
      institutions,
      label: trimmed,
    };
  }

  if (trimmed.startsWith('VIAF:') || trimmed.startsWith('viaf:')) {
    const identifier = normalizeIdentifier(trimmed.split(':').slice(1).join(':'));
    return {
      id: `viaf:${identifier}`,
      raw: trimmed,
      kind: 'author',
      identifierType: 'VIAF',
      identifier,
      authors: [],
      institutions: [],
      label: trimmed,
    };
  }

  if (trimmed.startsWith('ORCID:') || trimmed.startsWith('orcid:')) {
    const identifier = normalizeIdentifier(trimmed.split(':').slice(1).join(':'));
    return {
      id: `orcid:${identifier}`,
      raw: trimmed,
      kind: 'author',
      identifierType: 'ORCID',
      identifier,
      authors: [],
      institutions: [],
      label: trimmed,
    };
  }

  if (trimmed.startsWith('ROR:') || trimmed.startsWith('ror:')) {
    const identifier = normalizeIdentifier(trimmed.split(':').slice(1).join(':'));
    return {
      id: `ror:${identifier}`,
      raw: trimmed,
      kind: 'institution',
      identifierType: 'ROR',
      identifier,
      authors: [],
      institutions: [],
      label: trimmed,
    };
  }

  return {
    id: `text:${trimmed}`,
    raw: trimmed,
    kind: 'url',
    identifierType: 'URL',
    identifier: normalizeIdentifier(trimmed),
    authors,
    institutions,
    label: trimmed,
  };
}

export function parseReferences(text: string): InputItem[] {
  return text
    .split(/\n+/)
    .map((line) => parseLine(line))
    .filter((item): item is InputItem => Boolean(item));
}
