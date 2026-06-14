/* eslint-disable no-console -- CLI diagnostic script; output goes to stdout by design */
import redis, { setEx, get, del, exists, setJSON, getJSON } from '../config/redis.js';

const assert = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(
    `${ok ? '✅' : '❌'} ${label} → ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`
  );
  if (!ok) throw new Error(`Assertion failed: ${label}`);
};

const run = async () => {
  // 1. setEx returns 'OK'
  const setResult = await setEx('test:ping', 60, 'pong');
  assert('setEx(test:ping)', setResult, 'OK');

  // 2. get returns the stored value
  assert('get(test:ping)', await get('test:ping'), 'pong');

  // 3. setJSON returns 'OK'
  assert('setJSON(test:json)', await setJSON('test:json', 60, { a: 1, b: 2 }), 'OK');

  // 4. getJSON parses back to the object
  assert('getJSON(test:json)', await getJSON('test:json'), { a: 1, b: 2 });

  // 5. exists returns 1 for a present key
  assert('exists(test:ping)', await exists('test:ping'), 1);

  // 6. del returns the number of keys removed
  assert('del(test:ping)', await del('test:ping'), 1);

  // 7. exists returns 0 after deletion
  assert('exists(test:ping) after del', await exists('test:ping'), 0);

  // Cleanup the JSON key too.
  await del('test:json');

  console.log('\n✅ Redis all operations passed');
  await redis.quit();
  process.exit(0);
};

run().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  redis.disconnect();
  process.exit(1);
});
