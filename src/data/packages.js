// Mock package data for the clone (no real registry)
export const packages = [
  { name: 'react', description: 'React is a JavaScript library for building user interfaces.', version: '18.2.0', weeklyDownloads: 25000000 },
  { name: 'lodash', description: 'Lodash modular utilities.', version: '4.17.21', weeklyDownloads: 52000000 },
  { name: 'express', description: 'Fast, unopinionated, minimalist web framework for node.', version: '4.18.2', weeklyDownloads: 28000000 },
  { name: 'vue', description: 'Vue.js is a progressive, incrementally-adoptable JavaScript framework.', version: '3.4.0', weeklyDownloads: 22000000 },
  { name: 'axios', description: 'Promise based HTTP client for the browser and node.js', version: '1.6.2', weeklyDownloads: 45000000 },
  { name: 'typescript', description: 'TypeScript is a superset of JavaScript that compiles to clean JavaScript output.', version: '5.3.3', weeklyDownloads: 38000000 },
  { name: 'webpack', description: 'A bundler for javascript and friends.', version: '5.89.0', weeklyDownloads: 15000000 },
  { name: 'next', description: 'The React Framework for the Production.', version: '14.0.4', weeklyDownloads: 6000000 },
  { name: 'jest', description: 'Delightful JavaScript Testing.', version: '29.7.0', weeklyDownloads: 22000000 },
  { name: 'eslint', description: 'An AST-based pattern checker for JavaScript.', version: '8.55.0', weeklyDownloads: 25000000 },
];

export function findPackages(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return packages;
  return packages.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
  );
}

export function getPackage(name) {
  return packages.find((p) => p.name.toLowerCase() === name.toLowerCase()) || null;
}
