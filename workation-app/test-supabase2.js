const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bwuxojmyxjqdzthvludo.supabase.co', 'sb_publishable_We0xpICRIvqkaJsriQiq3A_Kzppb8T0');

async function test() {
  const { data: a, error: e1 } = await supabase.from('accommodations').select('*');
  console.log(JSON.stringify(a, null, 2));
}
test();
