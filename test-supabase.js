const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('Fetching writings...');
  const { data, error } = await supabase.from('writings').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Writings in DB:', data.length);
    console.log(data);
  }
}

test();
