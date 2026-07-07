const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bwuxojmyxjqdzthvludo.supabase.co', 'sb_publishable_We0xpICRIvqkaJsriQiq3A_Kzppb8T0');

async function test() {
  const { data: s, error: e2 } = await supabase.from('subsidies').select('*');
  console.log(JSON.stringify(s, null, 2));
}
test();
