const NodeCache = require('node-cache');

// Cache with 5 minute TTL for course list
const cache = new NodeCache({
  stdTTL: 300,       // 5 minutes
  checkperiod: 60,   // cleanup every 60 seconds
  useClones: false
});

const CACHE_KEYS = {
  COURSE_LIST: 'course_list',
  COURSE_DETAIL: (id) => `course_${id}`,
};

module.exports = { cache, CACHE_KEYS };
