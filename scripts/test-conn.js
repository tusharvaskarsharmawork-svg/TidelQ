const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function listTables() {
  // We can't list tables directly via the client, but we can try to query a known table or the REST API
  const { data, error } = await supabase.from('beaches').select('id').limit(1);
  if (error) {
    console.error('Error querying beaches:', error.message);
  } else {
    console.log('Successfully queried beaches table.');
  }
}

listTables();
