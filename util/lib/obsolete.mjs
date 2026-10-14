const versionRe = /(?<main>[\d\.]+)(?<tp>-(?<tag>\w+).(?<postfix>\d+))?/;

const handleVersion = (version) => {
  const groups = { ...versionRe.exec(version).groups };
  if (groups.tp) groups.postfixNum = parseInt(groups.postfix);
  delete groups.tp;
  return groups;
};

const mapGetOrCreate = (map, key, factory) => {
  if (map.has(key)) return map.get(key);
  const val = factory(key);
  map.set(key, val);
  return val;
};

const emptyMapFactory = () => new Map();
const emptyArrFactory = () => [];

export const obsolete = (info, last) => {
  const tagless = [];
  const actual = [];
  const obsolete = [];

  info.obsolete = { tagless, actual, obsolete };

  const toPush = { [true]: actual, [false]: obsolete };

  const majors = new Map();

  for (const v of info.versions) {
    const parsed = handleVersion(v);
    if (!parsed.tag) {
      tagless.push(v);
      continue;
    }
    const byTag = mapGetOrCreate(majors, parsed.main, emptyMapFactory);
    const tags = mapGetOrCreate(byTag, parsed.tag, emptyArrFactory);
    tags.push({ num: parsed.postfixNum, raw: v });
  }

  for (const { 1: byTag } of majors.entries()) {
    for (const { 1: tags } of byTag.entries()) {
      const actualSet = new Set(
        tags
          .map((i) => i.num)
          .sort((a, b) => a - b)
          .slice(-last),
      );

      for (const { num, raw } of tags) toPush[actualSet.has(num)].push(raw);
    }
  }

  return info;
};
