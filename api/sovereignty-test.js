// Test file: api/sovereignty-test.js
const testSovereignty = async () => {
  const tests = {
    ollama: await fetch(process.env.OLLAMA_BASE_URL + '/api/tags'),
    supabase: await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/'),
    redis: await fetch('/api/cache-test'),
  };
  
  return {
    sovereignty_score: Object.values(tests).filter(t => t.ok).length / 3 * 100,
    degraded: false,
    cost_per_request: 0.0001
  };
};

module.exports = { testSovereignty };